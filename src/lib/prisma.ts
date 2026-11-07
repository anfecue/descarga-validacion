import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const buildPrismaUrl = () => {
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
};

const prismaUrl = buildPrismaUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    prismaUrl
      ? {
          datasources: {
            db: {
              url: prismaUrl,
            },
          },
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
