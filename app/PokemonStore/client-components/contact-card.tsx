import { CardItem, SealedProduct } from './ssr/items-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { ContactForm } from './ssr/contact-card-ss';
import { toast } from "sonner";
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

interface ContactDialogProps {
  item: CardItem | SealedProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ item, open, onOpenChange }: ContactDialogProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (message: string, email: string, id: number) => {
    try {
      const response = await fetch('/api/contact-ponchos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          email,
          id: id,
          card_id: item.type === 'card' ? (item as CardItem).card_id : undefined,
          product_id: item.type === 'sealed' ? (item as SealedProduct).product_id : undefined,
          card: item.type === 'card' ? (item as CardItem).card : undefined,
          product_name: item.type === 'sealed' ? (item as SealedProduct).product_name : undefined,
          price: item.price
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
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setStatus('idle'); // Reset status when dialog closes
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

  const itemName =
    item.type === 'card'
      ? (item as CardItem).card
      : (item as SealedProduct).product_name;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setStatus('idle');
        setErrorMessage('');
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[640px] bg-[#0c0817] shadow-2xl shadow-black/60 rounded-2xl border border-white/10 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0 gap-0 [&>button]:text-zinc-300 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:bg-white/5 [&>button]:rounded-full [&>button]:p-2 [&>button]:ring-1 [&>button]:ring-white/10 [&>button]:hover:bg-white/10 [&>button]:transition-colors">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.12),_transparent_55%)]"
        />

        <div className="relative px-6 pt-6 pb-2 md:px-8 md:pt-7">
          <DialogHeader>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300 ring-1 ring-purple-500/30">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-purple-200/70">
                  Direct Message
                </p>
                <DialogTitle className="text-xl font-black tracking-tight text-white">
                  Contact Seller
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm leading-relaxed text-zinc-400">
              Interested in <span className="font-semibold text-zinc-200">{itemName}</span>? Send a
              message or make an offer — we&apos;ll get back to you soon.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative px-6 pb-6 md:px-8 md:pb-8">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-500/[0.06] px-6 py-10 ring-1 ring-emerald-500/20">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              </span>
              <h3 className="mb-1 text-lg font-bold text-white">Message sent</h3>
              <p className="max-w-sm text-center text-sm text-zinc-400">
                Thanks for reaching out — the seller will be in touch shortly.
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-red-500/[0.06] px-6 py-10 ring-1 ring-red-500/20">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/30">
                <AlertCircle className="h-8 w-8 text-red-300" />
              </span>
              <h3 className="mb-1 text-lg font-bold text-white">Couldn&apos;t send your message</h3>
              <p className="mb-5 max-w-sm text-center text-sm text-zinc-400">{errorMessage}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage('');
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-950/40 ring-1 ring-purple-400/30 transition hover:bg-purple-500"
              >
                Try again
              </button>
            </div>
          ) : (
            <ContactForm item={item} onSubmit={handleSubmit} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 