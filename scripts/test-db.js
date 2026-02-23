
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Testing Prisma Connection...")
    const userCount = await prisma.user.count()
    console.log(`Connection Successful! User count: ${userCount}`)
  } catch (error) {
    console.error("Prisma Connection Failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
