'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NewStockPage() {
  const router = useRouter();
  
  // Camera & Image state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
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
  
  const startCamera = async () => {
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Add Stock</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Camera / Image Section */}
        <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
          <h2 className="text-xl mb-4 font-semibold">Product Image</h2>
          
          {!cameraActive && !capturedImage && !uploadedUrl && (
            <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Open Camera
            </button>
          )}

          {cameraActive && (
            <div className="flex flex-col gap-4">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded bg-black" />
              <div className="flex gap-4">
                <button onClick={captureImage} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex-1">
                  Capture
                </button>
                <button onClick={stopCamera} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {capturedImage && !uploadedUrl && (
            <div className="flex flex-col gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Preview" className="w-full rounded border border-neutral-600" />
              <p>Is this photo okay?</p>
              <div className="flex gap-4">
                <button onClick={retakeImage} disabled={uploading} className="bg-neutral-600 hover:bg-neutral-500 px-4 py-2 rounded flex-1">
                  Retake
                </button>
                <button onClick={confirmImage} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex-1 disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Use Photo'}
                </button>
              </div>
            </div>
          )}

          {uploadedUrl && (
            <div className="flex flex-col gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadedUrl} alt="Uploaded" className="w-full rounded border border-green-500" />
              <p className="text-green-500 font-semibold">✓ Image ready</p>
              <button onClick={() => { setUploadedUrl(null); startCamera(); }} className="bg-neutral-600 hover:bg-neutral-500 px-4 py-2 rounded w-max text-sm">
                Replace Image
              </button>
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
          <form onSubmit={saveStock} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-200">Link to Product</label>
              <input 
                type="text" 
                placeholder="Search product... (Optional)"
                className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <span className="text-xs text-neutral-400">Enter product ID or name to link to an existing product.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-200">Buying Price (₹)</label>
              <input 
                type="number" 
                required 
                min="0.01" 
                step="0.01"
                className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
              />
              <span className="text-xs text-neutral-400">The price you paid to purchase this product.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-200">Stock Count</label>
              <input 
                type="number" 
                required 
                min="1"
                step="1"
                className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
              />
              <span className="text-xs text-neutral-400">Must be a positive whole number.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-200">Selling Price (₹)</label>
              <input 
                type="number" 
                required 
                min="0.01" 
                step="0.01"
                className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
              <span className="text-xs text-neutral-400">The price charged to the customer.</span>
            </div>

            <hr className="border-neutral-700" />
            
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Purchase</span>
                <span className="font-medium">₹{totalPurchase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Expected Return</span>
                <span className="font-medium">₹{expectedReturn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Expected Profit</span>
                <span className="font-medium">₹{expectedProfit.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-bold mt-2">
              Save Stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
