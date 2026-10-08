import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative z-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing and using Blactify (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          
          <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
          <p>Blactify is a Shopify Sales Dashboard that allows you to sync, monitor, and analyze your e-commerce operations. We provide data visualization tools for your store&apos;s performance.</p>

          <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
          <p>You must be authorized to use this application. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

          <h2 className="text-2xl font-semibold text-foreground">4. Data and Privacy</h2>
          <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service.</p>

          <h2 className="text-2xl font-semibold text-foreground">5. Termination</h2>
          <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </div>
      </div>
    </div>
  );
}
