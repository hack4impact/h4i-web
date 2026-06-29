import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

import { PrismaClient } from '../src/generated/client'
import { OPTION_LISTS, SEED_USERS } from './seed-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  // Clean up all tables in dependency order
  await db.account.deleteMany()
  await db.verificationToken.deleteMany()
  await db.user.deleteMany()
  await db.optionList.deleteMany()

  // Seed field option lists
  for (const { field, values } of OPTION_LISTS) {
    await db.optionList.createMany({
      data: values.map((value, order) => ({ field, value, order })),
    })
    console.log(`Seeded ${values.length} options for "${field}"`)
  }

  const devPassword = process.env.SEED_PASSWORD ?? 'password123'
  const hashed = await bcrypt.hash(devPassword, 12)

  // Seed chapter leaders and volunteers
  let created = 0
  for (const user of SEED_USERS) {
    await db.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashed,
        role: user.role,
        chapterId: user.chapterId ?? null,
        volunteerType: user.volunteerType,
        startYear: user.startYear,
        employer: user.employer ?? null,
        universityEmail: user.universityEmail ?? null,
        major: user.major ?? null,
        birthYear: user.birthYear,
        gender: user.gender,
        ethnicity: user.ethnicity,
        graduationYear: user.graduationYear ?? null,
      },
    })
    created++
  }
  console.log(`Seeded ${created} volunteer/leader accounts`)

  // Seed global admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
    ? await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12)
    : hashed
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin'

  await db.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Seeded admin account: ${adminEmail}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
