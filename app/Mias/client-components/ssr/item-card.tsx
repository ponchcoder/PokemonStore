import { items } from './items-data';
import Image from 'next/image';
import { useState } from 'react';

interface ItemCardProps {
  item: items;
}

export default function ItemCard({ item }: ItemCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col w-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <div className="h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          width={375}
          height={500}
          src={item.imageUrl} 
          alt={item.item_name}
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoadingComplete={() => setIsLoading(false)}
        />
      </div>
      
      {/* Item Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{item.item_name}</h3>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">Category: {item.category}</p>
          <p className="text-sm text-gray-600">Size: {item.size}</p>
          <p className="text-sm text-gray-600">Colors: {item.colors}</p>
          <p className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
