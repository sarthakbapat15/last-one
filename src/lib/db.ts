import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // Use a dedicated variable for Turso to prevent Prisma schema validation crashes
  const tursoUrl = process.env.TURSO_DATABASE_URL

  // If TURSO_DATABASE_URL is provided, use the Turso libSQL adapter
  if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    const adapter = new PrismaLibSQL(libsql)
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ['error'] })
  } else {
    // Local SQLite file fallback
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