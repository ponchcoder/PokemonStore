'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/PokemonStore');
    }
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-500 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Order Successful!</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          Thank you for your purchase! We&apos;ll process your order and get back to you shortly.
        </p>
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-gray-500 break-all">
            Order Reference: {sessionId}
          </p>
          <button
            onClick={() => router.push('/PokemonStore')}
            className="w-full sm:w-auto bg-purple-700 text-white px-6 py-2 rounded-md hover:bg-purple-800 transition-colors"
          >
            Return to Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-500 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 