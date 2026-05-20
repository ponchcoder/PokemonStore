'use client';

import { useState } from "react";
import Image from "next/image";
import { ItemDescriptionDialog } from "./item-description";
import { getItemKey, getItemSubtitle, getItemTitle, type PokemonStoreItem } from "@/lib/pokemon-store-items";

interface RecentlyAddedProps {
  items: PokemonStoreItem[];
  loading: boolean;
  className?: string;
}

function RecentSkeleton() {
  return (
    <>
        {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="w-36 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 shadow-md shadow-black/50 ring-1 ring-white/[0.07] sm:w-48">
          <div className="h-36 w-full animate-pulse bg-zinc-800 sm:h-48" />
          <div className="bg-zinc-800/75 p-2 sm:p-3">
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-zinc-700" />
            <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-zinc-700" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-700" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function RecentlyAdded({ items, loading, className = "" }: RecentlyAddedProps) {
  const [selectedItem, setSelectedItem] = useState<PokemonStoreItem | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const handleViewDetails = (item: PokemonStoreItem) => {
    setSelectedItem(item);
    setDescriptionOpen(true);
  };

  return (
    <div className={`mb-4 w-full ${className}`}>
      <h2 className="mb-4 text-xl font-bold text-white">Recently Added</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <RecentSkeleton />
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <button
              type="button"
              key={getItemKey(item)}
              className="w-36 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-zinc-900 text-left shadow-md shadow-black/50 ring-1 ring-white/[0.07] transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 hover:ring-purple-500/25 active:scale-95 sm:w-48"
              onClick={() => handleViewDetails(item)}
            >
              <div className="relative aspect-[3/4] w-full">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={getItemTitle(item)}
                    fill
                    sizes="(min-width: 640px) 192px, 144px"
                    className="object-cover"
                    priority={index < 3}
                    loading={index < 3 ? undefined : 'lazy'}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <span className="text-sm text-zinc-400">No Image</span>
                  </div>
                )}
              </div>

              <div className="bg-zinc-800/75 p-2 sm:p-3">
                <h3 className="truncate text-xs font-semibold text-white sm:text-sm">
                  {getItemTitle(item)}
                </h3>
                <p className="text-xs text-zinc-300 sm:text-sm">
                  {getItemSubtitle(item)}
                </p>
                <p className="text-base font-bold text-white sm:text-lg">${(item.price || 0).toFixed(2)}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="w-full flex-shrink-0 py-8 text-center text-zinc-400">
            No items available at the moment
          </div>
        )}
      </div>

      {selectedItem && (
        <ItemDescriptionDialog
          item={selectedItem}
          open={descriptionOpen}
          onOpenChange={setDescriptionOpen}
        />
      )}
    </div>
  );
}

