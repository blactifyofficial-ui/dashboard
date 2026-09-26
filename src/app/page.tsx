import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden text-center z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900 z-0"></div>
      
      <div className="relative z-10 space-y-8 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">Blactify</h1>
        <p className="text-xl md:text-2xl text-neutral-400">
          A powerful Shopify Sales Dashboard to track your store&apos;s performance in real-time. 
        </p>
        <p className="text-neutral-500">
          Sync orders, monitor revenue, and analyze performance with our intuitive data visualization tools. This application allows store owners to get a unified overview of their e-commerce operations.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link href="/login" className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors">
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
