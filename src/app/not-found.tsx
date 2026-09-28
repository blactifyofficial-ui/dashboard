import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-white/5 p-5 rounded-full mb-6 ring-1 ring-white/10 shadow-lg shadow-white/5">
        <FileQuestion className="w-12 h-12 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
        Page not found
      </h1>
      <p className="text-neutral-400 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or perhaps it never existed.
      </p>
      <Link 
        href="/"
        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50 bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95 h-10 px-6 py-2 shadow-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
