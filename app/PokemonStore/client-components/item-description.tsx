import { items } from './ssr/items-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { ItemDescriptionContent } from './ssr/item-description-ss';
import { ContactDialog } from './contact-card';
import { useState, useEffect } from 'react';

interface ItemDescriptionProps {
  item: items;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDescriptionDialog({ item, open, onOpenChange }: ItemDescriptionProps) {
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const handleOpenContact = () => {
      setContactOpen(true);
    };

    window.addEventListener('openContactDialog', handleOpenContact);
    return () => {
      window.removeEventListener('openContactDialog', handleOpenContact);
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[860px] bg-[#0c0817] shadow-2xl shadow-black/60 rounded-2xl border border-white/10 max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0 gap-0 [&>button]:text-zinc-300 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:bg-white/5 [&>button]:rounded-full [&>button]:p-2 [&>button]:ring-1 [&>button]:ring-white/10 [&>button]:hover:bg-white/10 [&>button]:transition-colors">
          <DialogHeader className="sr-only">
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          <ItemDescriptionContent item={item} />
        </DialogContent>
      </Dialog>

      <ContactDialog 
        item={item}
        open={contactOpen}
        onOpenChange={setContactOpen}
      />
    </>
  );
}