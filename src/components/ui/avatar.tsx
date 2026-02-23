"use client"

interface AvatarProps {
  name: string
  imageSrc?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl"
}

// Generate consistent color based on name
function getColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-amber-500"
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name (max 2 characters)
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, imageSrc, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const bgColor = getColorFromName(name)
  const initials = getInitials(name)

  if (imageSrc) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageSrc} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div 
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      title={name}
    >
      {initials}
    </div>
  )
}
