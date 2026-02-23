'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold">Critical Error</h2>
          <p className="text-muted-foreground">Something went wrong globally.</p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
