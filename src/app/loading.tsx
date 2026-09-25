import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Subtle glow effect behind spinner */}
        <div className="absolute -inset-4 rounded-full bg-white/10 blur-xl animate-pulse" />
        
        <Loader2 className="h-10 w-10 animate-spin text-neutral-200 relative z-10" />
      </div>
      
      <p className="text-sm font-medium tracking-wide text-neutral-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
}
