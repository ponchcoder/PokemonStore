'use client';

import { Button } from "../../../components/ui/button";
import { useCart } from './CartContext';
import { CardItem, SealedProduct } from './ssr/items-data';
import { useState } from 'react';

interface AddToCartProps {
  item: CardItem | SealedProduct;
}

export function AddToCart({ item }: AddToCartProps) {
  const { addItem, isInCart } = useCart();
  const alreadyInCart = isInCart(item.id);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddToCart = () => {
    if (alreadyInCart || !item.is_available) return;
    setIsAnimating(true);
    
    // Map the item to cart format
    const cartItem = {
      id: item.id,
      card_id: item.type === 'card' ? (item as CardItem).card_id : undefined,
      product_id: item.type === 'sealed' ? (item as SealedProduct).product_id : undefined,
      card: item.type === 'card' ? (item as CardItem).card : undefined,
      product_name: item.type === 'sealed' ? (item as SealedProduct).product_name : undefined,
      price: item.price,
      imageUrl: item.imageUrl,
      type: item.type,
      set: item.type === 'card' ? (item as CardItem).set : undefined,
      series: item.type === 'card' ? (item as CardItem).series : undefined,
      sealed_series: item.type === 'sealed' ? (item as SealedProduct).sealed_series : undefined,
      psa_grade: item.type === 'card' ? (item as CardItem).psa_grade : undefined,
      weight: item.weight
    };
    
    addItem(cartItem);
    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <Button 
      variant="outline"
      className={`w-full sm:flex-1 ${
        alreadyInCart 
          ? 'bg-gray-600 hover:bg-gray-600 !cursor-not-allowed' 
          : !item.is_available
          ? 'bg-gray-600 hover:bg-gray-600 !cursor-not-allowed'
          : 'bg-purple-700 hover:bg-purple-800 active:bg-purple-900 cursor-pointer'
      } text-white text-sm sm:text-base h-9 sm:h-10 whitespace-nowrap transition-all duration-200 border-0 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 ${
        isAnimating ? 'float-to-cart' : ''
      }`}
      onClick={handleAddToCart}
      disabled={alreadyInCart || !item.is_available}
    >
      {alreadyInCart ? 'In Cart' : !item.is_available ? 'Not Available' : 'Add to Cart'}
    </Button>
  );
} 