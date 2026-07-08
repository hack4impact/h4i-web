import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/client'
import { OPTION_LISTS } from './seed-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  await db.optionList.deleteMany()

  for (const { field, values } of OPTION_LISTS) {
    await db.optionList.createMany({
      data: values.map((value, order) => ({ field, value, order })),
    })
    console.log(`Seeded ${values.length} options for "${field}"`)
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
