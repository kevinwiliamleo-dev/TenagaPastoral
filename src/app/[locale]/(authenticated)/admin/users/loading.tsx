
import { TableSkeleton } from "@/components/ui/skeleton"

export default function UsersLoading() {
  return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <TableSkeleton rows={8} />
      </div>
  )
}
