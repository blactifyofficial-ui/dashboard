import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 text-foreground">
        <div className="bg-card border border-border p-4 rounded-full mb-4 shadow-none">
          <FileQuestion className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Page not found
          </h1>
          <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
            The page you are looking for does not exist or may have been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-95 bg-primary text-primary-foreground hover:opacity-90 h-10 px-6 shadow-none"
          >
            Return to Dashboard
          </Link>
      </div>
      );
}
