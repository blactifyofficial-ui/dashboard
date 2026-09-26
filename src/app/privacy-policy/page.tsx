import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative z-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-neutral-400 hover:text-white transition-colors">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        
        <div className="space-y-6 text-neutral-300">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
          <p>Welcome to Blactify. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.</p>
          
          <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
          <p>When you use Blactify, we may collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Email address, name, and other authentication details provided when you log in (e.g. via Google OAuth).</li>
            <li><strong>Shopify Data:</strong> Data synced from your Shopify store via Webhooks, which may include customer names, emails, order numbers, financial status, and order totals necessary for providing the dashboard analytics.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white">3. How We Use Your Information</h2>
          <p>We use the information we collect for various purposes, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, operate, and maintain our application.</li>
            <li>To generate analytics and visualizations for your Shopify store.</li>
            <li>To improve, personalize, and expand our services.</li>
            <li>To communicate with you, including for customer service and updates.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white">4. Sharing Your Information</h2>
          <p>We do not share, sell, rent, or trade your information with third parties for their promotional purposes. We may share information with third-party service providers (like our database hosting providers) who perform services for us, provided they agree to safeguard your information.</p>

          <h2 className="text-2xl font-semibold text-white">5. Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>

          <h2 className="text-2xl font-semibold text-white">6. Your Rights</h2>
          <p>You have the right to access, update, or delete the information we have on you. If you wish to exercise these rights, please contact us.</p>
          
          <h2 className="text-2xl font-semibold text-white">7. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact the administrator of Blactify.</p>
        </div>
      </div>
    </div>
  );
}
