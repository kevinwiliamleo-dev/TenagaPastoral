"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-100 text-gray-900">
          <h2 className="text-2xl font-bold">Terjadi Kesalahan!</h2>
          <button
            onClick={() => reset()}
            className="mt-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
