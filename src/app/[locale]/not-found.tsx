import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="bg-background font-display text-foreground min-h-screen flex flex-col antialiased">
      {/* Top Navigation */}
      <header className="w-full border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
              <h2 className="text-lg font-bold tracking-tight text-foreground">Pastoral System</h2>
            </div>
            <div>
              <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" href="#">
                Need Help?
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8">
          {/* Hero Illustration */}
          <div className="relative w-full max-w-[400px] aspect-[16/9] flex items-center justify-center">
            <div className="relative z-10 flex items-center justify-center">
              <h1 className="text-[120px] sm:text-[180px] font-extrabold text-muted leading-none select-none">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card p-4 rounded-full shadow-sm border border-border">
                  <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 border-2 border-card">
                    <span className="material-symbols-outlined text-sm font-bold block">question_mark</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Decorative Blur Background */}
            <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl transform scale-75 -z-0"></div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Silakan periksa URL atau kembali ke halaman utama.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link 
              href="/dashboard"
              className="group flex items-center justify-center gap-2 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-all w-full sm:w-auto shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span>Kembali ke Dashboard</span>
            </Link>
            <button className="flex items-center justify-center gap-2 h-12 px-8 bg-card border border-border text-foreground hover:bg-accent text-sm font-bold rounded-lg transition-all w-full sm:w-auto">
              <span className="material-symbols-outlined text-[20px]">flag</span>
              <span>Lapor Masalah</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-muted-foreground text-sm font-medium">
            © 2024 Pastoral Performance System. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors" href="#">Support</a>
            <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors" href="#">Contact Admin</a>
            <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors" href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
