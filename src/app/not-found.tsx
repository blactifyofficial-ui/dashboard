import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-4">
        <FileQuestion className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
        Page not found
      </h1>
      <p className="text-neutral-400 max-w-sm mb-6 text-sm leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link 
        href="/"
        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-white text-black hover:bg-neutral-200 h-10 px-5"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

