import NextAuth from "next-auth";
import { authOptions } from "./auth-options";

// Handler NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };