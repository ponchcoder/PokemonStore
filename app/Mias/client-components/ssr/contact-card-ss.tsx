import React, { useState } from 'react';
import { items } from './items-data';
import { Button } from "../../../../components/ui/button";
import Image from 'next/image';
import { EmailMatch } from '../email-match';

interface ContactFormProps {
  item: items;
  onSubmit: (message: string, email: string, id: number, size?: string, customSize?: string) => void;
}

export function ContactForm({ item, onSubmit }: ContactFormProps) {
  const [selectedSize, setSelectedSize] = useState('S');
  const [customSize, setCustomSize] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [showEmailErrors, setShowEmailErrors] = useState(false);
  
  const defaultMessage = "Hi, I'm interested in this item. Is it still available?";

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSize(e.target.value);
  };

  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomSize(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    setShowEmailErrors(true);
    if (!email) return;
    const messageToSend = message.trim() || defaultMessage;
    onSubmit(messageToSend, email, item.id, selectedSize, customSize);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
          )}
          <Image
            width={64}
            height={64}
            src={item.imageUrl} 
            alt={item.item_name} 
            className={`w-16 h-16 rounded object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
          />
        </div>
        <div>
          <h4 className="font-medium">{item.item_name}</h4>
          <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
        </div>
      </div>
      
      <EmailMatch onEmailMatch={setEmail} showErrors={showEmailErrors} />
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Your message</h4>
        <textarea 
          className="w-full p-2 border bg-white rounded-md h-24 resize-none"
          placeholder={defaultMessage}
          value={message}
          onChange={handleMessageChange}
        />
      </div>

      {/* Size Selection */}
      {(item.category === 'Tops' || item.category === 'Shorts' || item.category === 'Swimwear' || item.category === 'Sets') && (
        <div>
          <h4 className="text-sm font-medium">Select Size:</h4>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="S"
                checked={selectedSize === 'S'}
                onChange={handleSizeChange}
                required
              />
              <span className="ml-2">S</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="M"
                checked={selectedSize === 'M'}
                onChange={handleSizeChange}
                required
              />
              <span className="ml-2">M</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="L"
                checked={selectedSize === 'L'}
                onChange={handleSizeChange}
                required
              />
              <span className="ml-2">L</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="XL"
                checked={selectedSize === 'XL'}
                onChange={handleSizeChange}
                required
              />
              <span className="ml-2">XL</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="custom"
                checked={selectedSize === 'custom'}
                onChange={handleSizeChange}
                required
              />
              <span className="ml-2">Custom</span>
            </label>
          </div>
          {selectedSize === 'custom' && (
            <textarea
              placeholder="Enter your dimensions to the best of your knowledge, the more detail the better!"
              value={customSize}
              onChange={handleCustomSizeChange}
              className="mt-2 w-full h-24 p-2 border bg-white rounded-md resize-none"
              required
            />
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          className="bg-pink-200 hover:bg-pink-300 text-pink-800"
          onClick={handleSubmit}
          disabled={selectedSize === 'custom' && !customSize.trim()}
        >
          Send Message
        </Button>
      </div>
    </div>
  );
} 