import NextAuth from 'next-auth';
import { db } from '@/db';
import { comparePasswords } from './auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { Users } from '@/db/schema';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
  interface Session {
    user: User & {
      id: string;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const dbHelper = await db();
        const user = await dbHelper.getUserByEmail(credentials.email) as Users | null;

        if (!user || !user.id || !user.email || !user.password) return null;

        const isValid = await comparePasswords(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};