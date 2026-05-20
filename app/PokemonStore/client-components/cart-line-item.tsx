'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { CartItem } from "./CartContext";

interface CartLineItemProps {
  item: CartItem;
  onRemove?: (id: number) => void;
  showDetails?: boolean;
}

export function CartLineItem({ item, onRemove, showDetails = false }: CartLineItemProps) {
  const title = item.card || item.product_name || "Item";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        {item.imageUrl ? (
          <Image
            width={64}
            height={64}
            src={item.imageUrl}
            alt={title}
            className="h-16 w-16 object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-[10px] font-medium text-zinc-400">
            No Image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate font-medium text-white">{title}</h4>
        <p className="text-sm text-zinc-200">${item.price.toFixed(2)}</p>
        {showDetails && (
          <div className="mt-1 space-y-0.5 text-xs text-zinc-400">
            <p>{item.type === "card" ? `Set: ${item.set || "N/A"}` : `Series: ${item.sealed_series || "N/A"}`}</p>
            {item.type === "card" && <p>PSA Grade: {item.psa_grade || "N/A"}</p>}
          </div>
        )}
      </div>

      {onRemove && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="border-red-300/20 bg-red-600 text-white hover:bg-red-700 hover:text-white"
        >
          Remove
        </Button>
      )}
    </div>
  );
}

