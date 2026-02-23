const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@kpi.com' 
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} not found`)
    return
  }

  console.log(`Creating notification for user: ${user.name} (${user.id})`)

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM',
      title: 'Selamat Datang di Sistem Baru',
      message: 'Fitur notifikasi telah berhasil diaktifkan. Anda akan menerima update penting di sini.',
      linkUrl: '/notifications',
      linkText: 'Lihat Semua',
      isRead: false,
    },
  })

  console.log('Notification created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
