'use client';
import { useState, useRef, Suspense } from 'react';
import { Camera, Check, RefreshCw, Upload, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3 | 4 | 5 | 'success';

function PhoneCamera() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [productLink, setProductLink] = useState('');

  // Step 1: Camera
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
    if (!canvasRef.current || uploading) return;
    
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
      
      setProductImage(data.url);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async () => {
    try {
      setUploading(true);
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImage,
          productId: productName || productLink, // Using productId to store name/link context
          buyingPrice: Number(purchaseAmount),
          sellingPrice: Number(sellingAmount),
          stockCount: Number(stockCount),
        })
      });

      if (!res.ok) throw new Error("Failed to add stock");
      
      setStep('success');
    } catch (err) {
      console.error(err);
      alert("Failed to create stock. Please check details.");
    } finally {
      setUploading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
            <Check size={40} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">Stock Added!</h1>
          <p className="text-neutral-400 text-center mb-8">Your product has been added to the inventory.</p>
          <div className="flex w-full gap-3">
            <button onClick={() => window.close()} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all">
              Exit
            </button>
            <button onClick={() => router.push('/stocks')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all">
              View
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStepIndicators = () => (
    <div className="flex gap-2 mb-6 justify-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`h-1.5 rounded-full flex-1 max-w-[40px] ${step >= s ? 'bg-blue-500' : 'bg-white/10'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 text-white flex flex-col">
      <div className="mb-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight">Add Stock</h1>
        </div>
        {renderStepIndicators()}
      </div>

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <p className="text-neutral-400 text-sm mb-4">Step 1: Product Image</p>
            {!cameraActive && !capturedImage && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-8 bg-white/[0.01]">
                <Camera size={48} className="text-neutral-500 mb-6" />
                <button onClick={startCamera} className="w-full max-w-xs py-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                  <Camera size={20} /> Open Camera
                </button>
                <button onClick={() => setStep(2)} className="mt-4 text-sm text-neutral-400 hover:text-white transition-colors">
                  Skip for now
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
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-neutral-400 text-sm">Step 2: Basic Details</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Product Name</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. iPhone 15 Pro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Purchase Amount ($)</label>
                <input 
                  type="number" 
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button 
              onClick={() => setStep(3)} 
              disabled={!productName || !purchaseAmount}
              className="mt-auto py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-neutral-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-neutral-400 text-sm">Step 3: Inventory Details</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Stock Count</label>
                <input 
                  type="number" 
                  value={stockCount}
                  onChange={(e) => setStockCount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Selling Amount ($)</label>
                <input 
                  type="number" 
                  value={sellingAmount}
                  onChange={(e) => setSellingAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button 
              onClick={() => setStep(4)} 
              disabled={!stockCount || !sellingAmount}
              className="mt-auto py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-neutral-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-neutral-400 text-sm">Step 4: Additional Info</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Product Link (Optional)</label>
                <input 
                  type="url" 
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <button 
                onClick={() => setStep(5)} 
                className="py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => setStep(5)} 
                className="py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-neutral-300 transition-colors"
              >
                Skip Link
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-neutral-400 text-sm">Step 5: Summary</p>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-neutral-400">Total Purchase</span>
                <span className="text-xl font-medium text-white">${(Number(purchaseAmount) * Number(stockCount)).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-neutral-400">Total Sale Price</span>
                <span className="text-xl font-medium text-green-400">${(Number(sellingAmount) * Number(stockCount)).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-400">Expected Return</span>
                <span className="text-2xl font-bold text-blue-400">
                  ${((Number(sellingAmount) - Number(purchaseAmount)) * Number(stockCount)).toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              onClick={submitForm} 
              disabled={uploading}
              className="mt-auto py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {uploading ? 'Saving...' : 'Done'} <Check size={20} />
            </button>
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
