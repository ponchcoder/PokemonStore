'use client';
import { useCart } from './CartContext';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartLineItem } from './cart-line-item';

interface CartContentsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartContents({ isOpen, onOpenChange }: CartContentsProps) {
  const { items, totalItems, removeItem, clearCart, totalAmount, calculateShipping, totalWithShipping } = useCart();
  const [contactOpen, setContactOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const MINIMUM_PURCHASE = 5;
  const shippingCost = calculateShipping();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (totalItems === 0) {
    if (isOpen) onOpenChange(false);
    if (contactOpen) setContactOpen(false);
    return null;
  }

  const handleClearCart = () => {
    clearCart();
    onOpenChange(false);
  };

  const handleContactSubmit = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const messageToSend = message.trim() || "Hi, I'm interested in these items. Are they still available?";

    try {
      const response = await fetch('/api/contact-ponchos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          email: email.toLowerCase(),
          items: items.map(item => ({
            id: item.id,
            card_id: item.card_id,
            product_id: item.product_id,
            card: item.card,
            product_name: item.product_name,
            price: item.price,
            set: item.set,
            series: item.series,
            psa_grade: item.psa_grade
          })),
          totalAmount: totalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      toast.success('Message sent successfully!', {
        duration: 3000,
        position: 'top-center',
      });
      
      setTimeout(() => {
        setContactOpen(false);
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
      toast.error('Failed to send message. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const handleCheckout = async () => {
    if (totalAmount < MINIMUM_PURCHASE) {
      toast.error(`Minimum purchase amount of $${MINIMUM_PURCHASE} is required`);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: items.map((item) => ({
            id: item.id,
            type: item.type,
          })),
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-500 shadow-lg rounded-lg border border-gray-300">
          <DialogHeader className="flex-none">
            <DialogTitle className="text-white">Shopping Cart</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 my-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>

            {items.length > 0 && (
              <div className="flex-none border-t border-zinc-600 pt-4 mt-auto">
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Subtotal:</span>
                    <span className="text-white">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Shipping:</span>
                    <span className="text-white">${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Total:</span>
                    <span className="text-white font-bold">${totalWithShipping.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    className="bg-red-600 hover:bg-red-700 text-white border-0"
                  >
                    Clear Cart
                  </Button>
                </div>
                {totalAmount < MINIMUM_PURCHASE && (
                  <p className="text-red-500 text-sm mb-4">
                    Minimum purchase amount of ${MINIMUM_PURCHASE} is required
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                    onClick={() => setContactOpen(true)}
                  >
                    Contact Seller
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCheckout}
                    disabled={isLoading || totalAmount < MINIMUM_PURCHASE}
                  >
                    {isLoading ? 'Processing...' : 'Checkout'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setStatus('idle');
          setErrorMessage('');
          setEmail('');
          setMessage('');
        }
        setContactOpen(newOpen);
      }}>
        <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-500 shadow-lg rounded-lg border border-gray-300 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Contact Seller</DialogTitle>
            <DialogDescription className="text-md text-white">
              Interested in these items? Send a message to the seller.
            </DialogDescription>
          </DialogHeader>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Message Sent Successfully!</h3>
              <p className="text-white text-center">Thank you for your interest. The seller will contact you soon.</p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Failed to Send Message</h3>
              <p className="text-white text-center mb-4">{errorMessage}</p>
              <Button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage('');
                }}
                className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-md transition-colors"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
                {items.map((item) => (
                  <CartLineItem key={item.id} item={item} showDetails />
                ))}
              </div>

              <div className="border-t border-zinc-600 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-medium">Total:</span>
                  <span className="text-white font-bold">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white" htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Your message</h4>
                <textarea 
                  className="w-full p-2 border border-gray-200 bg-white rounded-md h-24 resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Hi, I'm interested in these items. Are they still available?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white transition-colors duration-200"
                  onClick={handleContactSubmit}
                >
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 