"use client";
import { useState } from"react";
import { authClient } from"@/lib/auth/client";

export default function LoginPage() {
 const [loading, setLoading] = useState(false);

 const handleGoogleLogin = async () => {
 setLoading(true);
 try {
 await authClient.signIn.social({ provider:"google", callbackURL:"/"});
 } catch (e) {
 console.error(e);
 setLoading(false);
 }
 };

 return (
 <div className="flex min-h-screen w-full items-center justify-center bg-black relative">
 <div className="z-10 flex flex-col items-center max-w-sm w-full px-6">
 <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 uppercase">Blactify</h1>
 <p className="text-sm text-neutral-400 mb-8 text-center">Admin Dashboard Access</p>
 
 <button
 onClick={handleGoogleLogin}
 disabled={loading}
 className="w-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-medium focus:ring-4 focus:ring-white/20 outline-none disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
 >
 {loading ? (
 <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"/>
 ) : (
 <svg viewBox="0 0 24 24"className="w-5 h-5"aria-hidden="true">
 <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.25024 6.60998L5.27028 9.73498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"fill="#EA4335"/>
 <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.18 21.28C22.57 19.09 24 15.96 24 12.275H23.49Z"fill="#4285F4"/>
 <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.23999 6.57983C0.43993 8.17983 0 9.99983 0 11.9998C0 13.9998 0.43993 15.8198 1.24 17.4198L5.26498 14.2949Z"fill="#FBBC05"/>
 <path d="M12.0004 24C15.2404 24 17.9654 22.935 20.0604 21.095L16.0754 17.905C14.9554 18.655 13.5604 19.1 12.0004 19.1C8.8754 19.1 6.22038 16.995 5.2754 14.125L1.25037 17.25C3.25538 21.17 7.3104 24 12.0004 24Z"fill="#34A853"/>
 </svg>
 )}
 Sign in with Google
 </button>
 </div>
 </div>
 );
}
