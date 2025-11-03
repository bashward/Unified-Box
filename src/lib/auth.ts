import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        name: profile.given_name || profile.name || undefined,
        image: profile.picture || undefined,
      }),
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false },
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
});
