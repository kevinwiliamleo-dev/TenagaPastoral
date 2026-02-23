import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const status: {
    status: string
    timestamp: string
    uptime: number
    database: string
    version: string
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "unknown",
    version: "2.0.0",
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    status.database = "connected"
  } catch {
    status.status = "degraded"
    status.database = "disconnected"
  }

  const httpStatus = status.status === "ok" ? 200 : 503

  return NextResponse.json(status, { status: httpStatus })
}
