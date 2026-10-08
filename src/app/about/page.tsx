import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden text-center z-10">
      <div className="relative z-10 space-y-8 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">Blactify</h1>
        <p className="text-xl md:text-2xl text-muted-foreground">
          A powerful Shopify Sales Dashboard to track your store&apos;s performance in real-time. 
        </p>
        <p className="text-muted-foreground/80">
          Sync orders, monitor revenue, and analyze performance with our intuitive data visualization tools. This application allows store owners to get a unified overview of their e-commerce operations.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link href="/login" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-opacity shadow-sm">
            Go to Login
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
