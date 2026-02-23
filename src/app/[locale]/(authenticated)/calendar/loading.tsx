import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  // Shared layout handles the shell, so we just return the inner loading state
  return (
      <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm p-4">
           {/* Header Skeleton */}
           <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
              <div className="flex gap-4">
                 <Skeleton className="h-8 w-32" />
                 <div className="flex gap-1">
                    <Skeleton className="size-8" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="size-8" />
                 </div>
              </div>
              <div className="flex gap-4">
                 <Skeleton className="h-4 w-16 rounded-full" />
                 <Skeleton className="h-4 w-16 rounded-full" />
                 <Skeleton className="h-4 w-16 rounded-full" />
              </div>
           </div>

           {/* Grid Skeleton */}
           <div className="grid grid-cols-7 gap-px bg-border/50 h-[500px]">
              {Array.from({ length: 35 }).map((_, i) => (
                 <div key={i} className="bg-card min-h-[100px] p-2">
                    <Skeleton className="size-6 rounded-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                 </div>
              ))}
           </div>
        </div>
      </div>
  )
}
