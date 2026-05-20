import React, { useState } from 'react';
import { CardItem, SealedProduct } from './items-data';
import { Button } from "../../../../components/ui/button";
import Image from 'next/image';
import { Send } from 'lucide-react';
import { toast } from "sonner";

interface ContactFormProps {
  item: CardItem | SealedProduct;
  onSubmit: (message: string, email: string, id: number) => void;
}

export function ContactForm({ item, onSubmit }: ContactFormProps) {
  const [message, setMessage] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const defaultMessage = "Hi, I'm interested in this item. Is it still available?";
  const itemName =
    item.type === 'card'
      ? (item as CardItem).card
      : (item as SealedProduct).product_name;
  const itemMeta =
    item.type === 'card'
      ? `Set: ${(item as CardItem).set}`
      : `Series: ${(item as SealedProduct).sealed_series}`;

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    if (isSent) return;
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const messageToSend = message.trim() || defaultMessage;
    setIsSent(true);
    onSubmit(messageToSend, email.toLowerCase(), item.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/[0.06]">
          {item.imageUrl ? (
            <>
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
                </div>
              )}
              <Image
                width={64}
                height={64}
                src={item.imageUrl}
                alt={itemName}
                className={`h-full w-full object-cover transition-opacity duration-200 ${
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-zinc-500">
              No Image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-white">{itemName}</h4>
          <p className="truncate text-xs text-zinc-400">{itemMeta}</p>
          {item.type === 'card' && (
            <p className="truncate text-xs text-zinc-400">PSA Grade: {(item as CardItem).psa_grade}</p>
          )}
        </div>
        <span className="flex-shrink-0 rounded-full bg-purple-600/20 px-2.5 py-1 text-sm font-bold text-purple-200 ring-1 ring-purple-500/30">
          ${item.price.toFixed(2)}
        </span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200/70">
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSent}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200/70">
          Your Message
        </label>
        <textarea
          id="contact-message"
          className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
          placeholder={defaultMessage}
          value={message}
          onChange={handleMessageChange}
          disabled={isSent}
        />
        <p className="text-[11px] text-zinc-500">
          Leave empty to send the default message above.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-zinc-500">
          We&apos;ll only use your email to reply about this item.
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSent}
          className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-all ${
            isSent
              ? 'cursor-not-allowed bg-zinc-800 text-zinc-500 ring-1 ring-white/5'
              : 'bg-purple-600 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/30 hover:bg-purple-500'
          }`}
        >
          <Send className="h-4 w-4" />
          {isSent ? 'Sending…' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
}
