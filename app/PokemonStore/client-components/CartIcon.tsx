'use client';
import { useCart } from './CartContext';
import { useState, useEffect } from 'react';
import { Button } from "../../../components/ui/button";
import Image from 'next/image';
import { CartContents } from './CartContents';

export function CartIcon() {
  const { totalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  // Reset cart open state when cart becomes empty
  useEffect(() => {
    if (totalItems === 0) {
      setIsOpen(false);
    }
  }, [totalItems]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-8 z-50 p-0 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 bg-transparent hover:bg-transparent pokeball-fade-in"
        variant="ghost"
      >
        <Image
          src="/pokeball.png"
          alt="Cart"
          width={64}
          height={64}
          className="w-16 h-16"
        />
        <span className="absolute -top-5 -right-5 bg-black text-white text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center shadow-md">
          {totalItems}
        </span>
      </Button>

      <CartContents isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
} 