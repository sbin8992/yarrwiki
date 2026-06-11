import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL

const prismaClientSingleton = () => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for writable database access.")
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
