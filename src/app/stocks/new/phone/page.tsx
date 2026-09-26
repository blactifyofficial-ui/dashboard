'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Check, RefreshCw, Upload, X } from 'lucide-react';

function PhoneCamera() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvasRef.current.toDataURL('image/png'));
        stopCamera();
      }
    }
  };

  const confirmImage = async () => {
    if (!canvasRef.current || uploading || !sessionId) return;
    
    setUploading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => 
        canvasRef.current!.toBlob(resolve, 'image/webp', 0.8)
      );
      
      if (!blob) throw new Error("Could not convert image");

      const formData = new FormData();
      formData.append('image', blob, 'stock-product.webp');

      const res = await fetch('/api/stocks/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      // Send URL to laptop session
      const syncRes = await fetch('/api/stocks/camera-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, url: data.url })
      });

      if (syncRes.ok) {
        setSuccess(true);
      } else {
        throw new Error("Failed to sync with laptop");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!sessionId) {
    return <div className="p-8 text-white text-center">Invalid session link. Please scan the QR code again.</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
            <Check size={40} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">Photo Uploaded!</h1>
          <p className="text-neutral-400 text-center mb-8">You can now return to your laptop to complete adding the stock.</p>
          <button onClick={() => window.close()} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all">
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 text-white flex flex-col">
      <div className="mb-6 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Product Camera</h1>
        <p className="text-neutral-400 text-sm">Take a photo to sync with your dashboard</p>
      </div>

      <div className="flex-1 flex flex-col">
        {!cameraActive && !capturedImage && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-8 bg-white/[0.01]">
            <Camera size={48} className="text-neutral-500 mb-6" />
            <button onClick={startCamera} className="w-full max-w-xs py-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              <Camera size={20} />
              Open Camera
            </button>
          </div>
        )}

        {cameraActive && (
          <div className="flex flex-col gap-4 flex-1">
            <div className="relative flex-1 bg-black rounded-3xl overflow-hidden border border-white/10">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover absolute inset-0" />
            </div>
            <div className="flex gap-4">
              <button onClick={captureImage} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium flex items-center justify-center gap-2">
                <Camera size={20} /> Capture
              </button>
              <button onClick={stopCamera} className="py-4 px-6 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center">
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {capturedImage && (
          <div className="flex flex-col gap-4 flex-1">
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setCapturedImage(null); startCamera(); }} disabled={uploading} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center justify-center gap-2">
                <RefreshCw size={20} /> Retake
              </button>
              <button onClick={confirmImage} disabled={uploading} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <><Upload size={20} className="animate-bounce" /> Uploading...</> : <><Check size={20} /> Use Photo</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhonePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white text-center">Loading...</div>}>
      <PhoneCamera />
    </Suspense>
  );
}
