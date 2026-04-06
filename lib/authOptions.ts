import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidEmail, normalizeEmail } from "@/lib/security";
import type { Role } from "@/lib/permissions";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = normalizeEmail(credentials.email);
        if (!isValidEmail(email)) {
          throw new Error("Invalid credentials");
        }

        const loginRateLimit = checkRateLimit(`login:${email}`, {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });

        if (!loginRateLimit.success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        await dbConnect();

        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google login failed: No email provided");
          return false;
        }

        await dbConnect();
        try {
          const normalizedEmail = normalizeEmail(user.email);
          const existingUser = await User.findOne({ email: normalizedEmail });

          if (!existingUser) {
            await User.create({
              email: normalizedEmail,
              name: user.name || "Google User",
              role: "STUDENT",
            });
          }
          return true;
        } catch (error) {
          console.error("Error saving Google user", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      } else if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
