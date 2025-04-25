import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

// Define authOptions as a constant first
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email dan Password wajib diisi");
          }

          const result = await pool.query(`
            SELECT u.*, r.name as role_name,
                  COALESCE(
                    json_agg(
                      DISTINCT jsonb_build_object(
                        'id', m.id,
                        'name', m.menu_name,
                        'icon', m.icon,
                        'path', m.path
                      )
                    ) FILTER (WHERE m.id IS NOT NULL),
                    '[]'
                  ) as menus
            FROM "User" u
            LEFT JOIN "Role" r ON u."roleId" = r.id
            LEFT JOIN role_menus rm ON u."roleId" = rm.role_id
            LEFT JOIN menus m ON rm.menu_id = m.id
            WHERE u.email = $1
            GROUP BY u.id, r.name
          `, [credentials.email]);

          const user = result.rows[0];

          if (!user) {
            throw new Error("User tidak ditemukan");
          }

          // Menggunakan kolom password_hash sesuai struktur database
          if (!user.password_hash) {
            console.error("Password hash field not found in user data");
            throw new Error("Konfigurasi sistem tidak valid");
          }

          // Validasi password menggunakan bcrypt.compare
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            throw new Error("Password tidak valid");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            role: user.role_name,
            menus: user.menus || []
          };
        } catch (error) {
          console.error("Auth Error:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId;
        token.role = user.role;
        token.menus = user.menus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.roleId = token.roleId;
        session.user.role = token.role;
        session.user.menus = token.menus;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
};

// Create the NextAuth handler using the authOptions
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST methods
export { handler as GET, handler as POST };