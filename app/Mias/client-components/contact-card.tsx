import { items } from './ssr/items-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { ContactForm } from './ssr/contact-card-ss';
import { toast } from "sonner";

interface ContactDialogProps {
  item: items;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ item, open, onOpenChange }: ContactDialogProps) {
  const handleSubmit = async (message: string, email: string, id: number, size?: string, customSize?: string) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          email,
          size,
          customSize,
          itemName: item.item_name,
          price: item.price,
          id: id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-pink-100 shadow-lg rounded-lg border border-gray-300 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>Contact Seller</DialogTitle>
          <DialogDescription className="text-md text-gray-800">
            Interested in this {item.item_name}? Send a message to the seller.
          </DialogDescription>
        </DialogHeader>
        
        <ContactForm item={item} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
} 