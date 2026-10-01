'use client';
import { useState, useEffect } from 'react';
import { Eye, EyeClosed } from 'lucide-react';
import PinModal from './PinModal';
import { verifyRevenuePin } from '@/app/actions/revenuePin';

export default function RevenueCard({ totalSales }: { totalSales: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible]);

  const toggleVisibility = () => {
    if (isVisible) {
      setIsVisible(false);
    } else {
      setIsModalOpen(true);
      setError('');
    }
  };

  const handleVerifyPin = async (pin: string) => {
    setIsLoading(true);
    setError('');
    try {
      const isValid = await verifyRevenuePin(pin);
      if (isValid) {
        setIsVisible(true);
        setIsModalOpen(false);
      } else {
        setError('Invalid PIN');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>

        <div className="flex items-center justify-between relative z-10 mb-2 md:mb-3">
          <h2 className="text-sm font-medium text-neutral-400">Total Revenue (All Time)</h2>
          <button
            onClick={toggleVisibility}
            className="text-neutral-400 hover:text-white active:text-white min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors"
            aria-label={isVisible ? "Hide revenue" : "Show revenue"}
          >
            {isVisible ? <Eye size={19} /> : <EyeClosed size={19} />}
          </button>
        </div>

        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight relative z-10 truncate mt-auto">
          {isVisible
            ? `₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '₹••••••••'}
        </p>
      </div>

      {isModalOpen && (
        <PinModal
          isOpen={isModalOpen}
          isLoading={isLoading}
          error={error}
          onConfirm={handleVerifyPin}
          onCancel={() => {
            setIsModalOpen(false);
            setError('');
          }}
        />
      )}
    </>
  );
}
