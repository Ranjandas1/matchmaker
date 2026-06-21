import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const envEmail = process.env.NEXT_PUBLIC_USER_EMAIL!;
        const envPassword = process.env.NEXT_PUBLIC_USER_PASSWORD!;

        // Check email
        if (credentials.email !== envEmail) {
          throw new Error("User not found");
        }

        // If password is plain text
        if (credentials.password !== envPassword) {
          throw new Error("Invalid credentials");
        }

        // If password is bcrypt hashed instead
        // const valid = await bcrypt.compare(credentials.password, envPassword);
        // if (!valid) throw new Error("Invalid credentials");

        const randomName = `User-${Math.floor(Math.random() * 10000)}`;

        return {
          id: crypto.randomUUID(),
          name: randomName,
          email: envEmail,
          role: "admin",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name as string;
        token.email = user.email as string;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
