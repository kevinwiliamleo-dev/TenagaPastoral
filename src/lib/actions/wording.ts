"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"

// Flatten nested JSON object to dot-notation keys
// e.g. { Sidebar: { dashboard: "Dashboard" } } -> { "Sidebar.dashboard": "Dashboard" }
function flattenMessages(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(result, flattenMessages(obj[key], fullKey))
    } else {
      result[fullKey] = String(obj[key])
    }
  }
  return result
}

// Unflatten dot-notation keys back to nested object
// e.g. { "Sidebar.dashboard": "Dashboard" } -> { Sidebar: { dashboard: "Dashboard" } }
function unflattenMessages(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const key in flat) {
    const parts = key.split(".")
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = flat[key]
  }
  return result
}

/**
 * Get all default messages for a locale, merged with any database overrides
 */
export async function getWordingsForLocale(locale: string = "id") {
  try {
    // Load default messages from file
    const defaultMessages = (await import(`../../../messages/${locale}.json`)).default
    const flatDefaults = flattenMessages(defaultMessages)
    
    // Load overrides from database
    const overrides = await prisma.systemWording.findMany({
      where: { locale },
      select: { key: true, value: true, description: true }
    })
    
    const overrideMap: Record<string, { value: string; description: string | null }> = {}
    for (const o of overrides) {
      overrideMap[o.key] = { value: o.value, description: o.description }
    }
    
    // Build combined list for admin UI
    const items = Object.entries(flatDefaults).map(([key, defaultValue]) => ({
      key,
      defaultValue,
      customValue: overrideMap[key]?.value || null,
      description: overrideMap[key]?.description || null,
    }))
    
    return items
  } catch (error) {
    console.error("Error loading wordings:", error)
    return []
  }
}

/**
 * Get merged messages (default + overrides) for i18n use — CACHED
 */
async function _getMergedMessages(locale: string = "id"): Promise<Record<string, any>> {
  try {
    const defaultMessages = (await import(`../../../messages/${locale}.json`)).default
    
    // Load overrides
    const overrides = await prisma.systemWording.findMany({
      where: { locale },
      select: { key: true, value: true }
    })
    
    if (overrides.length === 0) return defaultMessages
    
    // Flatten defaults, apply overrides, unflatten
    const flat = flattenMessages(defaultMessages)
    for (const o of overrides) {
      if (flat[o.key] !== undefined) {
        flat[o.key] = o.value
      }
    }
    
    return unflattenMessages(flat)
  } catch (error) {
    console.error("Error merging messages:", error)
    // Fallback to file-based messages
    return (await import(`../../../messages/${locale}.json`)).default
  }
}

// Cached version — revalidates every 5 minutes or on tag invalidation
export const getMergedMessages = unstable_cache(
  _getMergedMessages,
  ["i18n-messages"],
  { revalidate: 300, tags: ["messages"] }
)

/**
 * Save a custom wording override (Admin only)
 */
export async function updateWording(key: string, value: string, locale: string = "id") {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  try {
    await prisma.systemWording.upsert({
      where: { key_locale: { key, locale } },
      update: { value },
      create: { key, value, locale }
    })
    
    revalidatePath("/", "layout")
    revalidateTag("messages")
    return { success: true }
  } catch (error) {
    console.error("Error updating wording:", error)
    return { success: false, error: "Failed to save" }
  }
}

/**
 * Reset a wording to default (delete override)
 */
export async function resetWording(key: string, locale: string = "id") {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  try {
    await prisma.systemWording.deleteMany({
      where: { key, locale }
    })
    
    revalidatePath("/", "layout")
    revalidateTag("messages")
    return { success: true }
  } catch (error) {
    console.error("Error resetting wording:", error)
    return { success: false, error: "Failed to reset" }
  }
}

/**
 * Bulk save multiple wordings at once
 */
export async function bulkUpdateWordings(updates: Array<{ key: string; value: string }>, locale: string = "id") {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  try {
    // Use transaction for atomic updates
    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.systemWording.upsert({
          where: { key_locale: { key, locale } },
          update: { value },
          create: { key, value, locale }
        })
      )
    )
    
    revalidatePath("/", "layout")
    revalidateTag("messages")
    return { success: true, count: updates.length }
  } catch (error) {
    console.error("Error bulk updating wordings:", error)
    return { success: false, error: "Failed to save" }
  }
}

/**
 * Reset ALL custom wordings for a locale
 */
export async function resetAllWordings(locale: string = "id") {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  try {
    const deleted = await prisma.systemWording.deleteMany({
      where: { locale }
    })
    
    revalidatePath("/", "layout")
    revalidateTag("messages")
    return { success: true, count: deleted.count }
  } catch (error) {
    console.error("Error resetting all wordings:", error)
    return { success: false, error: "Failed to reset" }
  }
}
