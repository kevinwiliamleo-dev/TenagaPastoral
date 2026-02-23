import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPasswordRaw() {
  console.log('Resetting admin password via raw SQL...')
  
  try {
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash('admin123', 12)
    console.log('Generated hash:', hashedPassword)
    
    // Update using raw SQL to bypass Prisma schema validation
    const result = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@kpi.com'
    `
    
    console.log('Rows updated:', result)
    console.log('')
    console.log('✅ Password updated successfully!')
    console.log('')
    console.log('📋 Login Credentials:')
    console.log('   Email:    admin@kpi.com')
    console.log('   Password: admin123')
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswordRaw()
