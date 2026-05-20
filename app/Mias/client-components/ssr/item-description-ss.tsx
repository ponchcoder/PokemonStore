import Image from 'next/image';
import { items, featuredCards } from './items-data';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ItemDescriptionContentProps {
  item: items;
}

export function ItemDescriptionContent({ item }: ItemDescriptionContentProps) {
  const [selectedColor, setSelectedColor] = useState(item.colors);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState(item);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Find all items with the same name to get available colors
    const itemsWithSameName = featuredCards.filter(
      (card) => card.item_name === item.item_name
    );
    
    // Extract unique colors
    const colors = [...new Set(itemsWithSameName.map((item) => item.colors))];
    setAvailableColors(colors);
    
    // Set initial selected color to the current item's color
    setSelectedColor(item.colors);
  }, [item]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    setCurrentImageIndex(0); // Reset image index when color changes
    setIsLoading(true);
    
    // Find the item with the same name and selected color
    const newItem = featuredCards.find(
      (card) => card.item_name === item.item_name && card.colors === newColor
    );
    
    // Update the selected item if found
    if (newItem) {
      setSelectedItem(newItem);
    }
  };

  const nextImage = () => {
    if (selectedItem.additionalImages && selectedItem.additionalImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === selectedItem.additionalImages.length - 1 ? 0 : prevIndex + 1
      );
      setIsLoading(true);
    }
  };

  const prevImage = () => {
    if (selectedItem.additionalImages && selectedItem.additionalImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? selectedItem.additionalImages.length - 1 : prevIndex - 1
      );
      setIsLoading(true);
    }
  };

  // Map of color names to their TailwindCSS color classes
  const colorClasses: Record<string, string> = {
    'Red': 'bg-red-500',
    'Blue': 'bg-blue-500',
    'Green': 'bg-green-500',
    'Pink': 'bg-pink-500',
    'Yellow': 'bg-yellow-400',
    'White': 'bg-white',
    'Purple': 'bg-purple-500',
    'Black': 'bg-black'
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-5">
      {/* Item Image Column */}
      <div className="flex-shrink-0 flex flex-col space-y-2 w-full md:w-auto">
        {/* Image Carousel */}
        <div className="relative w-full aspect-[3/4] md:w-[400px] group">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
          )}
          {selectedItem.additionalImages && selectedItem.additionalImages.length > 0 ? (
            <>
              <Image
                fill
                src={selectedItem.additionalImages[currentImageIndex]} 
                alt={`${selectedItem.item_name} - Image ${currentImageIndex + 1}`}
                className="rounded-lg object-cover relative z-10"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />

              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20">
                {currentImageIndex + 1} / {selectedItem.additionalImages.length}
              </div>
            </>
          ) : (
            <Image
              fill
              src={selectedItem.imageUrl} 
              alt={selectedItem.item_name}
              className="rounded-lg object-cover relative z-10"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}
        </div>

        {/* Thumbnails with Navigation */}
        {selectedItem.additionalImages && selectedItem.additionalImages.length > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={prevImage}
              className="p-2 bg-pink-300 text-white rounded-full hover:bg-pink-500 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft />
            </Button>
            
            <div className="flex justify-center gap-2 overflow-x-auto py-2 max-w-[calc(100%-100px)] scrollbar-hide">
              {selectedItem.additionalImages.map((image, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setIsLoading(true);
                  }}
                  className={`p-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all ${
                    currentImageIndex === index ? 'border-black scale-105' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    width={64}
                    height={64}
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Button>
              ))}
            </div>

            <Button
              onClick={nextImage}
              className="p-2 bg-pink-300 text-white rounded-full hover:bg-pink-500 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
      
      {/* Item Details and Color Selection */}
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold">{selectedItem.item_name}</h2>
        
        {/* Color Selection */}
        <div className="">
          <h4 className="text-sm font-medium mb-3">Select Color:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
            {availableColors.map((color) => (
              <label 
                key={color} 
                className="inline-flex items-center gap-2 w-fit rounded-md cursor-pointer"
              >
                <input
                  type="radio"
                  value={color}
                  checked={selectedColor === color}
                  onChange={handleColorChange}
                  className="sr-only"
                />
                <span 
                  className={`h-8 w-8 rounded-full ${colorClasses[color]} ${
                    selectedColor === color 
                      ? color === 'Black' ? 'border-3 border-gray-400' : 'border-3 border-black'
                      : ''
                  }`}
                ></span>
                <span className="text-sm font-medium">{color}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Category:</span> 
            <span className="text-gray-900">{selectedItem.category}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Size:</span> 
            <span className="text-gray-900">{selectedItem.size}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Price:</span> 
            <span className="text-xl font-bold text-gray-900">${selectedItem.price.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-gray-700">
            {selectedItem.description}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            className="bg-pink-200 hover:bg-pink-300 text-pink-800"
            onClick={() => {
              const event = new CustomEvent('openContactDialog');
              window.dispatchEvent(event);
            }}
          >
            Contact Seller
          </Button>
        </div>
      </div>
    </div>
  );
}