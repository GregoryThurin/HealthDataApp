import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import db from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const existing = await db.execute({
        sql: "SELECT id FROM users WHERE email = ?",
        args: [user.email!],
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
          args: [user.id!, user.email!, user.name ?? null],
        });
      }

      return true;
    },
    async session({ session }) {
      const result = await db.execute({
        sql: "SELECT id FROM users WHERE email = ?",
        args: [session.user.email!],
      });
      if (result.rows[0]) {
        (session.user as any).id = result.rows[0].id as string;
      }
      return session;
    },
  },
});
