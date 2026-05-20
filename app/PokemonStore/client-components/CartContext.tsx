import { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: number;
  card_id?: string;
  product_id?: string;
  card?: string;
  product_name?: string;
  price: number;
  imageUrl: string | null;
  type: 'card' | 'sealed';
  set?: string;
  series?: string;
  sealed_series?: string;
  psa_grade?: string;
  weight: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  totalItems: number;
  totalAmount: number;
  calculateShipping: () => number;
  totalWithShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems(prevItems => [...prevItems, item]);
  };

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (id: number) => {
    return items.some(item => item.id === id);
  };

  const totalItems = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  
  const calculateShipping = () => {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight >= 2) return 10;
    if (totalWeight >= 1.5) return 8;
    return 5;
  };

  const totalWithShipping = totalAmount + calculateShipping();

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      clearCart, 
      isInCart, 
      totalItems, 
      totalAmount,
      calculateShipping,
      totalWithShipping 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 