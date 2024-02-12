import { db } from "@vercel/postgres"
import bcrypt from "bcrypt"

const users = [
  {
    name: "raoul",
    email: "raoul@flexup.com",
    password: "123456",
  },
]

async function seedUsers(client) {
  try {
    await client.sql`
    DROP EXTENSION "uuid-ossp"
    CREATE EXTENSION "uuid-ossp"`

    const createTable = await client.sql`
      DROP TABLE users
      CREATE TABLE users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status BOOLEAN DEFAULT false,
        onboardingId DEFAULT uuid_generate_v4()

      );
    `

    console.log(`Created "users" table`)

    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10)
        return client.sql`
        INSERT INTO users (name, email, password)
        VALUES (${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `
      })
    )

    console.log(`Seeded ${insertedUsers.length} users`)

    return {
      createTable,
      users: insertedUsers,
    }
  } catch (error) {
    console.error("Error seeding users:", error)
    throw error
  }
}

async function main() {
  const client = await db.connect()

  await seedUsers(client)

  await client.end()
}

main().catch((err) => {
  console.error("An error occurred while attempting to seed the database:", err)
})
