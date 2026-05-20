'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { featuredCards, items } from './ssr/items-data';
import { ItemDescriptionDialog } from './item-description';
import { ContactDialog } from './contact-card';
import { Button } from "../../../components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ItemCard from './ssr/item-card';

interface ItemGridProps {
  selectedCategories: string[];
}

export default function ItemGrid({ selectedCategories }: ItemGridProps) {
  const [selectedItem, setSelectedItem] = useState<items | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => 
    featuredCards.filter((item) => 
      selectedCategories.length === 0 || selectedCategories.includes(item.category)
    ),
    [selectedCategories]
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = useMemo(() => 
    filteredItems.slice(startIndex, endIndex),
    [filteredItems, startIndex, endIndex]
  );

  const handleViewDetails = useCallback((item: items) => {
    setSelectedItem(item);
    setDescriptionOpen(true);
  }, []);

  const handleContactSeller = useCallback((item: items) => {
    setSelectedItem(item);
    setContactOpen(true);
  }, []);

  const scrollToTop = useCallback(() => {
    if (gridRef.current) {
      const elementPosition = gridRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 20; // 100px offset from top

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setTimeout(scrollToTop, 100); // Small delay to ensure state update
  }, [scrollToTop]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    setTimeout(scrollToTop, 100); // Small delay to ensure state update
  }, [totalPages, scrollToTop]);

  return (
    <>
      <div ref={gridRef} className="container mx-auto rounded-lg px-4 py-8 bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 shadow-lg shadow-teal-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <div key={item.id} className="flex flex-col">
              <div className="flex flex-col w-full max-w-[400px] mx-auto p-4 rounded-lg shadow-md bg-pink-100 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <ItemCard item={item} />
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="w-full sm:flex-1 bg-pink-200 hover:bg-pink-300 text-pink-800 text-sm sm:text-base h-10 whitespace-nowrap hover:scale-105 transition-transform duration-300"
                  onClick={() => handleViewDetails(item)}
                >
                  View Details
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:flex-1 bg-pink-200 hover:bg-pink-300 text-pink-800 text-sm sm:text-base h-10 whitespace-nowrap hover:scale-105 transition-transform duration-300"
                  onClick={() => handleContactSeller(item)}
                >
                  Contact Seller
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              className="bg-pink-200 hover:bg-pink-300 text-pink-800"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            
            <span className="text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              className="bg-pink-200 hover:bg-pink-300 text-pink-800"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Item Description Dialog */}
      {selectedItem && (
        <ItemDescriptionDialog 
          item={selectedItem} 
          open={descriptionOpen} 
          onOpenChange={setDescriptionOpen} 
        />
      )}

      {/* Contact Seller Dialog */}
      {selectedItem && (
        <ContactDialog 
          item={selectedItem} 
          open={contactOpen} 
          onOpenChange={setContactOpen} 
        />
      )}
    </>
  );
} 