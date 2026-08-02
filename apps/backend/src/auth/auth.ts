import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const prisma = new PrismaClient();

const getTrustedOrigins = (): string[] => {
  const origins = ['https://darkcloudems.online'];
  const envOrigins = process.env.CORS_ORIGIN;
  if (envOrigins && envOrigins !== '*') {
    origins.push(...envOrigins.split(','));
  }
  return Array.from(new Set(origins));
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: getTrustedOrigins(),
});
