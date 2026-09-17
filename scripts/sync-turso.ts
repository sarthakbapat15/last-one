import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL!
const token = process.env.TURSO_AUTH_TOKEN!

const client = createClient({ url, authToken: token })

async function syncSchema() {
  console.log('Connecting to Turso...')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS AppSettings (
      id TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
      rateOverrides TEXT NOT NULL DEFAULT '{}',
      rateVersion TEXT NOT NULL DEFAULT '',
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✓ AppSettings table created')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT NOT NULL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email)
    )
  `)
  console.log('✓ User table created')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Post (
      id TEXT NOT NULL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      authorId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✓ Post table created')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS SavedEstimate (
      id TEXT NOT NULL PRIMARY KEY,
      clientName TEXT NOT NULL,
      label TEXT NOT NULL,
      data TEXT NOT NULL,
      totalCost INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✓ SavedEstimate table created')

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log('\nTables in Turso:')
  tables.rows.forEach(r => console.log('  -', r.name))

  // Test write
  await client.execute(`INSERT OR IGNORE INTO AppSettings (id, rateOverrides, rateVersion) VALUES ('singleton', '{}', '')`)
  const settings = await client.execute(`SELECT * FROM AppSettings WHERE id = 'singleton'`)
  console.log('\n✓ Test write/read successful:', JSON.stringify(settings.rows[0]))

  await client.close()
  console.log('\n🎉 Turso database is ready!')
}

syncSchema().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
