const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@kpi.com'
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.log('User not found')
    return
  }

  // Seed Activities for Heatmap (Last 30 days)
  console.log('Seeding activities...')
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Create random 0-5 activities per day
    const count = Math.floor(Math.random() * 5)
    for (let j = 0; j < count; j++) {
      await prisma.pastoralActivity.create({
        data: {
          userId: user.id,
          title: `Seed Activity ${i}-${j}`,
          pillar: ['LITURGIA', 'DIAKONIA', 'KERYGMA', 'KOINONIA', 'MARTYRIA'][Math.floor(Math.random()*5)],
          date: date,
          duration: 60,
          description: 'Seeded for heatmap verification'
        }
      })
    }
  }
  console.log('Activities seeded.')

  // Seed Evaluation History for Trend Chart
  console.log('Seeding evaluation history...')
  // Create 3 past periods if they don't exist
  const periods = [
    { name: 'Periode Q1 2024', start: '2024-01-01', end: '2024-03-31' },
    { name: 'Periode Q2 2024', start: '2024-04-01', end: '2024-06-30' },
    { name: 'Periode Q3 2024', start: '2024-07-01', end: '2024-09-30' }
  ]

  for (const p of periods) {
    let period = await prisma.evaluationPeriod.findFirst({ where: { name: p.name } })
    if (!period) {
      period = await prisma.evaluationPeriod.create({
        data: {
          name: p.name,
          startDate: new Date(p.start),
          endDate: new Date(p.end),
          status: 'CLOSED'
        }
      })
    }

    // Create a submission for this period
    const submission = await prisma.evaluationSubmission.create({
      data: {
        periodId: period.id,
        appraiseeId: user.id,
        appraiserId: user.id, // Self eval for simplicity
        status: 'SUBMITTED',
        isFinal: true,
        submittedAt: new Date(p.end)
      }
    })

    // Create some answers to generate score
    // Random score 3-5
    const score = 3 + Math.random() * 2
    await prisma.evaluationAnswer.create({
      data: {
        submissionId: submission.id,
        questionId: 'dummy-q', // Logic doesn't check q relation strictness for avg
        scoreValue: score
      }
    })
  }
  console.log('Evaluation history seeded.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
