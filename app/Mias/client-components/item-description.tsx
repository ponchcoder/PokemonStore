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
        <DialogContent className="bg-pink-100 shadow-lg rounded-lg border border-gray-300 max-w-[95vw] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto scrollbar-hide px-2 md:px-4">
          <DialogHeader>
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