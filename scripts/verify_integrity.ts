
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Starting Integrity Verification...")

  // 1. Setup: Create a Test User
  const testUser = await prisma.user.create({
    data: {
      email: "test_integrity_" + Date.now() + "@test.com",
      password: "hashed_password_placeholder",
      name: "Integrity Tester",
      role: "PASTORAL_STAFF"
    }
  })
  console.log(`[SETUP] Created User: ${testUser.id}`)

  // 2. Setup: Create Data linked to User
  // A. Activity (Should Cascade Delete)
  const activity = await prisma.pastoralActivity.create({
    data: {
      title: "Test Activity",
      pillar: "LITURGIA",
      date: new Date(),
      duration: 60,
      userId: testUser.id
    }
  })
  console.log(`[SETUP] Created Activity: ${activity.id}`)

  // B. Task (Should SetNull on AssignedTo, Cascade on CreatedBy)
  // We'll test "AssignedTo" link first. To test this properly, we need a creator.
  // We'll use the same user as creator for simplicity, but strictly we want to test 'assignedTo' behavior.
  // Actually, if we delete the creator, the task might be deleted because of 'CreatedTasks'. 
  // Let's create a SECOND user to be the creator, so we can test deleting the ASSIGNEE.
  
  const creatorUser = await prisma.user.create({
    data: {
      email: "creator_" + Date.now() + "@test.com",
      password: "hashed_password",
      name: "Task Creator",
      role: "ADMIN"
    }
  })

  const task = await prisma.pastoralTask.create({
    data: {
      title: "Test Task",
      createdBy: creatorUser.id,
      assignedTo: testUser.id,
      priority: "MEDIUM",
      status: "TODO"
    }
  })
  console.log(`[SETUP] Created Task: ${task.id} (Assigned to Test User)`)

  // 3. Action: Delete the Test User
  console.log(`[ACTION] Deleting User: ${testUser.id}...`)
  await prisma.user.delete({
    where: { id: testUser.id }
  })
  console.log(`[ACTION] User Deleted.`)

  // 4. Verification: Check Data State
  
  // Check Activity (Should be GONE)
  const checkActivity = await prisma.pastoralActivity.findUnique({
    where: { id: activity.id }
  })
  
  if (checkActivity) {
    console.error(`[FAIL] PastoralActivity ${activity.id} still exists! Cascade Delete FAILED.`)
  } else {
    console.log(`[PASS] PastoralActivity was automatically deleted.`)
  }

  // Check Task (Should exist, but assignedTo should be NULL)
  const checkTask = await prisma.pastoralTask.findUnique({
    where: { id: task.id }
  })

  if (!checkTask) {
    console.error(`[FAIL] PastoralTask ${task.id} was deleted! expected SetNull.`)
  } else {
    if (checkTask.assignedTo === null) {
      console.log(`[PASS] PastoralTask assignedTo is now NULL.`)
    } else {
      console.error(`[FAIL] PastoralTask assignedTo is ${checkTask.assignedTo}, expected NULL.`)
    }
  }

  // Cleanup
  await prisma.user.delete({ where: { id: creatorUser.id } }).catch(() => {})
  if (checkTask) await prisma.pastoralTask.delete({ where: { id: task.id } }).catch(() => {})

  console.log("Verification Complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
