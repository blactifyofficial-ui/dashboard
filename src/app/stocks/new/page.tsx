'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, RefreshCw, Check, X, Upload, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function NewStockPage() {
  const router = useRouter();
  
  // Camera & Image state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // Phone Sync State
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [showQR, setShowQR] = useState(false);
  
  // Form state
  const [buyingPrice, setBuyingPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [productId, setProductId] = useState('');
  
  // Calculated state
  const bp = Number(buyingPrice) || 0;
  const sc = Number(stockCount) || 0;
  const sp = Number(sellingPrice) || 0;
  
  const totalPurchase = bp * sc;
  const expectedReturn = sp * sc;
  const expectedProfit = expectedReturn - totalPurchase;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/stocks/camera-session?id=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setUploadedUrl(data.url);
              setShowQR(false); // Hide QR when successful
            }
          }
        } catch {
          // ignore
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [showQR, sessionId]);

  const phoneUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/stocks/new/phone?session=${sessionId}` : '';
  
  const startCamera = async () => {
    setShowQR(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
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
        // Do not upload yet. Just preview.
        const dataUrl = canvasRef.current.toDataURL('image/png'); // Will convert to webp later
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmImage = async () => {
    if (!canvasRef.current || uploading) return;
    
    setUploading(true);
    try {
      // Convert to WebP for optimization
      const blob = await new Promise<Blob | null>((resolve) => 
        canvasRef.current!.toBlob(resolve, 'image/webp', 0.8)
      );
      
      if (!blob) throw new Error("Could not convert image to WebP");

      const formData = new FormData();
      formData.append('image', blob, 'stock-product.webp');

      const res = await fetch('/api/stocks/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setUploadedUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("Upload failed, please try again.");
    } finally {
      setUploading(false);
      setCapturedImage(null);
    }
  };

  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyingPrice: Number(buyingPrice),
          stockCount: Number(stockCount),
          sellingPrice: Number(sellingPrice),
          productId: productId || null,
          productImage: uploadedUrl
        })
      });

      if (!res.ok) throw new Error("Failed to save stock");
      
      alert("Stock saved successfully!");
      router.push('/stocks');
    } catch (error) {
      console.error(error);
      alert("Error saving stock");
    }
  };

  return (
    <div className="space-y-12 relative z-10 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Add Stock</h1>
          <p className="text-neutral-400 text-sm md:text-base">Enter details and capture product image to add new stock</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera / Image Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Product Image</h2>
            
            <div className="flex-1 flex flex-col">
              {!cameraActive && !capturedImage && !uploadedUrl && !showQR && (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 bg-white/[0.01]">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Camera size={32} className="text-neutral-400" />
                  </div>
                  <p className="text-neutral-400 mb-6 text-center text-sm">Capture an image of the product.</p>
                  
                  <div className="flex flex-col w-full gap-3 max-w-xs">
                    <button onClick={startCamera} className="w-full inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <Camera size={18} />
                      <span>Use Laptop Camera</span>
                    </button>
                    
                    <button onClick={() => setShowQR(true)} className="w-full inline-flex items-center justify-center px-6 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <Smartphone size={18} />
                      <span>Take Photo with Phone</span>
                    </button>
                  </div>
                </div>
              )}

              {showQR && !uploadedUrl && (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 bg-white/[0.01]">
                  <h3 className="text-lg font-semibold text-white mb-2 text-center">Scan with your phone</h3>
                  <p className="text-neutral-400 mb-6 text-center text-sm max-w-xs">Point your phone camera at this QR code to take a photo. It will sync automatically.</p>
                  
                  <div className="bg-white p-4 rounded-2xl mb-6">
                    <QRCodeCanvas value={phoneUrl} size={200} />
                  </div>
                  
                  <button onClick={() => setShowQR(false)} className="inline-flex items-center justify-center px-6 py-2 border border-white/10 bg-white/5 text-neutral-300 rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm">
                    Cancel
                  </button>
                  <p className="text-xs text-neutral-500 mt-4 text-center max-w-xs">Make sure your phone is connected to the same WiFi network if running locally.</p>
                </div>
              )}

              {cameraActive && (
                <div className="flex flex-col gap-4 flex-1">
                  <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[300px]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover absolute inset-0" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={captureImage} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <Camera size={18} />
                      <span>Capture</span>
                    </button>
                    <button onClick={stopCamera} className="inline-flex items-center justify-center px-6 py-3 border border-red-500/20 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {capturedImage && !uploadedUrl && (
                <div className="flex flex-col gap-4 flex-1">
                  <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImage} alt="Preview" className="w-full h-full object-cover min-h-[300px]" />
                  </div>
                  <p className="text-neutral-300 text-center text-sm font-medium">Is this photo okay?</p>
                  <div className="flex gap-4">
                    <button onClick={retakeImage} disabled={uploading} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <RefreshCw size={18} />
                      <span>Retake</span>
                    </button>
                    <button onClick={confirmImage} disabled={uploading} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-green-500/20 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 text-sm font-semibold transition-all backdrop-blur-sm gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {uploading ? (
                        <>
                          <Upload size={18} className="animate-bounce" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Use Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {uploadedUrl && (
                <div className="flex flex-col gap-4 flex-1">
                  <div className="relative flex-1 rounded-2xl overflow-hidden border border-green-500/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedUrl} alt="Uploaded" className="w-full h-full object-cover min-h-[300px]" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-400 font-medium bg-green-500/10 border border-green-500/20 py-2 rounded-xl">
                    <Check size={18} />
                    <span>Image ready</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => { setUploadedUrl(null); startCamera(); }} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <Camera size={18} />
                      <span className="truncate">Webcam</span>
                    </button>
                    <button onClick={() => { setUploadedUrl(null); setShowQR(true); }} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm gap-2">
                      <Smartphone size={18} />
                      <span className="truncate">Phone</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Stock Details</h2>
            
            <form onSubmit={saveStock} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-300">Link to Product</label>
                <input 
                  type="text" 
                  placeholder="Search product... (Optional)"
                  className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-500"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
                <span className="text-xs text-neutral-500">Enter product ID or name to link to an existing product.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-300">Buying Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01"
                    placeholder="0.00"
                    className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-500"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-300">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01"
                    placeholder="0.00"
                    className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-500"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-300">Stock Count</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  step="1"
                  placeholder="e.g. 100"
                  className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-500"
                  value={stockCount}
                  onChange={(e) => setStockCount(e.target.value)}
                />
                <span className="text-xs text-neutral-500">Must be a positive whole number.</span>
              </div>

              <div className="my-4 border-t border-white/10"></div>
              
              <div className="flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Total Purchase</span>
                  <span className="font-semibold text-white">₹{totalPurchase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Expected Return</span>
                  <span className="font-semibold text-white">₹{expectedReturn.toFixed(2)}</span>
                </div>
                <div className="pt-2 mt-1 border-t border-white/5 flex justify-between items-center text-green-400">
                  <span className="font-medium text-sm">Expected Profit</span>
                  <span className="font-bold text-lg">₹{expectedProfit.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-4 border border-white/10 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-bold transition-all backdrop-blur-sm mt-2">
                Save Stock
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
