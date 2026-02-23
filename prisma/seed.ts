import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Create Admin user (only required fields)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kpi.com' },
    update: {
      password: hashedPassword, // Update password in case it exists
    },
    create: {
      email: 'admin@kpi.com',
      name: 'Administrator',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create sample Pastoral Staff user
  const staffPassword = await bcrypt.hash('staff123', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'pastor@kpi.com' },
    update: {
      password: staffPassword,
    },
    create: {
      email: 'pastor@kpi.com',
      name: 'Bapak Pastor Yohanes',
      password: staffPassword,
      role: Role.PASTORAL_STAFF,
    },
  })

  console.log('✅ Staff user created:', staff.email)

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('   Admin:  admin@kpi.com / admin123')
  console.log('   Staff:  pastor@kpi.com / staff123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
