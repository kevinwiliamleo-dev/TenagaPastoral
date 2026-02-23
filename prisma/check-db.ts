import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('Checking database connection and schema...')
  
  try {
    // Try to get existing users
    const users = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`
    console.log('Users table columns:', users)
    
    // Get existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })
    console.log('Existing users:', existingUsers)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
