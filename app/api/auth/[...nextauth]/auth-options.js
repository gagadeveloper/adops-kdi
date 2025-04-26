import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

// Fungsi logger untuk error autentikasi
const logAuthError = (context, error) => {
  console.error(`[${new Date().toISOString()}] AUTH ERROR in ${context}:`, 
                error.message, 
                "\nStack:", error.stack);
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Deteksi proses build
        const isBuildProcess = process.env.NODE_ENV === 'production' && 
                              (process.env.NEXT_PHASE === 'phase-production-build' || 
                               process.env.__NEXT_PROCESSED_ENV);
        
        if (isBuildProcess) {
          console.log('Build process detected, skipping auth');
          return null;
        }
        
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email dan Password wajib diisi");
          }

          // Coba koneksi ke database
          if (!pool) {
            throw new Error("Database connection not available");
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

          // Periksa hasil query
          if (!result || !result.rows || result.rows.length === 0) {
            console.log(`No user found with email: ${credentials.email}`);
            throw new Error("User tidak ditemukan");
          }

          const user = result.rows[0];

          if (!user.password_hash) {
            console.error("Password hash not found in user data:", user);
            throw new Error("Konfigurasi sistem tidak valid");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            console.log(`Invalid password attempt for user: ${credentials.email}`);
            throw new Error("Password tidak valid");
          }

          // Return data user yang berhasil login
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            role: user.role_name,
            menus: user.menus || []
          };
        } catch (error) {
          logAuthError('authorize', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.roleId = user.roleId;
          token.role = user.role;
          token.menus = user.menus;
        }
        return token;
      } catch (error) {
        logAuthError('jwt callback', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.roleId = token.roleId;
          session.user.role = token.role;
          session.user.menus = token.menus;
        }
        return session;
      } catch (error) {
        logAuthError('session callback', error);
        return session;
      }
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error"
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
};