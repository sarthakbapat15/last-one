import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const dbUrl = process.env.DATABASE_URL || ''

  // If DATABASE_URL points to Turso (libsql://), use the adapter
  if (dbUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSql({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ['error'] })
  } else {
    // Local SQLite file
    globalForPrisma.prisma = new PrismaClient({ log: ['query'] })
  }

  return globalForPrisma.prisma
}

// Export a proxy that lazily initializes the client on first property access
// This ensures env vars are loaded by Next.js before we read them
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
