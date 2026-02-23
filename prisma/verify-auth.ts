import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function verifyAuth() {
  console.log('=== Verifying Authentication ===\n')
  
  try {
    // Get admin user with password
    const result = await prisma.$queryRaw<Array<{email: string, password: string, role: string}>>`
      SELECT email, password, role FROM users WHERE email = 'admin@kpi.com'
    `
    
    if (result.length === 0) {
      console.log('❌ Admin user not found!')
      return
    }
    
    const user = result[0]
    console.log('User found:')
    console.log('  Email:', user.email)
    console.log('  Role:', user.role)
    console.log('  Password hash:', user.password?.substring(0, 30) + '...')
    console.log('')
    
    // Test password comparison
    const testPassword = 'admin123'
    console.log('Testing password:', testPassword)
    
    if (!user.password) {
      console.log('❌ Password field is NULL or empty!')
      return
    }
    
    // Check if it's a valid bcrypt hash
    const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    console.log('Is bcrypt hash:', isBcryptHash ? '✅ Yes' : '❌ No')
    
    if (isBcryptHash) {
      const matches = await bcrypt.compare(testPassword, user.password)
      console.log('Password match:', matches ? '✅ PASSED' : '❌ FAILED')
      
      if (!matches) {
        // Generate a new correct hash
        const newHash = await bcrypt.hash(testPassword, 12)
        console.log('\nNew hash generated:', newHash)
        
        // Update password with raw SQL
        const updated = await prisma.$executeRaw`
          UPDATE users SET password = ${newHash} WHERE email = 'admin@kpi.com'
        `
        console.log('Password updated:', updated > 0 ? '✅ Success' : '❌ Failed')
        
        // Verify again
        const verifyMatch = await bcrypt.compare(testPassword, newHash)
        console.log('Verify new hash:', verifyMatch ? '✅ Works' : '❌ Failed')
      }
    } else {
      console.log('Password is NOT a bcrypt hash. Updating...')
      const newHash = await bcrypt.hash(testPassword, 12)
      await prisma.$executeRaw`UPDATE users SET password = ${newHash} WHERE email = 'admin@kpi.com'`
      console.log('✅ Password updated with bcrypt hash')
    }
    
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

verifyAuth()
