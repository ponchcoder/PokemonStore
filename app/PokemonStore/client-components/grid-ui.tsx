'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCart } from "./AddToCart";
import { CartIcon } from "./CartIcon";
import { ItemDescriptionDialog } from "./item-description";
import type { Category } from "./ssr/advanced-filter";
import { filterPokemonStoreItems, type SortDirection, type SortField } from "@/lib/pokemon-store-filter";
import { getItemKey, getItemMetaRows, getItemTitle, type PokemonStoreItem } from "@/lib/pokemon-store-items";

interface ItemGridProps {
  items: PokemonStoreItem[];
  loading: boolean;
  selectedCategories: Category[];
}

const ITEMS_PER_PAGE = 16;

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="ml-1 text-current">
      {direction ? (
        <span className="flex items-center text-current">
          {direction === "desc" ? "↑↓" : "↓↑"}
        </span>
      ) : (
        <span className="flex items-center text-current opacity-50">↓↑</span>
      )}
    </span>
  );
}

function GridSkeleton() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <div key={index} className="w-full">
          <div className="mx-auto flex w-full flex-col rounded-lg p-1 backdrop-blur-sm sm:p-3">
                  <div className="w-full overflow-hidden rounded-lg bg-zinc-900 shadow-lg shadow-black/50 ring-1 ring-white/[0.07]">
                    <div className="aspect-[3/4] w-full animate-pulse bg-zinc-800" />
                    <div className="bg-zinc-800/75 p-2 sm:p-3 md:p-4">
                      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-zinc-700" />
                      <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-zinc-700" />
                      <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-zinc-700" />
                      <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-700" />
                    </div>
                  </div>
                  <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="h-9 animate-pulse rounded bg-zinc-700 sm:h-10" />
                    <div className="h-9 animate-pulse rounded bg-zinc-700 sm:h-10" />
                  </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function ItemGrid({
  items,
  loading,
  selectedCategories,
}: ItemGridProps) {
  const [selectedItem, setSelectedItem] = useState<PokemonStoreItem | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(
    () => filterPokemonStoreItems(items, selectedCategories, searchTerm, sortField, sortDirection),
    [items, searchTerm, selectedCategories, sortDirection, sortField]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : current === "desc" ? null : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const handleViewDetails = useCallback((item: PokemonStoreItem) => {
    setSelectedItem(item);
    setDescriptionOpen(true);
  }, []);

  const showPsaSort = selectedCategories.some((category) => category.id === "cards");

  return (
    <div className="flex w-full flex-col">
      <CartIcon />

      <div ref={gridRef} className="mx-auto w-full max-w-screen rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-[#211735] to-zinc-800 px-4 py-8 shadow-xl shadow-black/35">
        <h2 className="mb-8 text-center text-2xl font-bold text-white">Pokemon Shop</h2>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product name..."
                className="h-10 w-full rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3 text-white placeholder-zinc-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                variant="default"
                onClick={() => handleSort("price")}
                className="flex flex-1 items-center justify-center rounded-xl border-0 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Price
                <SortIcon direction={sortField === "price" ? sortDirection : null} />
              </Button>
              {showPsaSort && (
                <Button
                  variant="default"
                  onClick={() => handleSort("psa_grade")}
                  className="flex flex-1 items-center justify-center rounded-xl border-0 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
                >
                  PSA Grade
                  <SortIcon direction={sortField === "psa_grade" ? sortDirection : null} />
                </Button>
              )}
              <Button
                variant="default"
                onClick={() => handleSort("uploadDate")}
                className="flex flex-1 items-center justify-center rounded-xl border-0 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Upload Date
                <SortIcon direction={sortField === "uploadDate" ? sortDirection : null} />
              </Button>
            </div>
          </div>
        </div>

        <p className="mb-4 text-base font-medium text-white sm:text-lg">
          Showing {filteredItems.length} of {items.length} items
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
          {loading ? (
            <GridSkeleton />
          ) : currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <div key={getItemKey(item)} className="w-full">
                <div className="mx-auto flex w-full flex-col rounded-lg p-1 backdrop-blur-sm sm:p-3">
                  <div className="w-full overflow-hidden rounded-lg bg-zinc-900 shadow-lg shadow-black/50 ring-1 ring-white/[0.07]">
                    <div className="relative aspect-[3/4] w-full">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={getItemTitle(item)}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-contain p-2 sm:p-3"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                          <span className="text-sm text-zinc-400">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-800/75 p-2 backdrop-blur-sm sm:p-3 md:p-4">
                      <h3 className="mb-1 line-clamp-1 text-xs font-semibold text-white sm:mb-2 sm:text-sm md:text-base">
                        {getItemTitle(item)}
                      </h3>
                      <div className="space-y-0.5 sm:space-y-1">
                        {getItemMetaRows(item).map((row, rowIndex) => (
                          <p
                            key={`${getItemKey(item)}-${row}`}
                            className={`${rowIndex < 2 ? "line-clamp-1 " : ""}text-[10px] text-zinc-300 sm:text-xs md:text-sm`}
                          >
                            {row}
                          </p>
                        ))}
                        <p className="mt-1 text-sm font-bold text-white sm:mt-2 sm:text-lg md:text-xl">${(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="h-9 w-full cursor-pointer whitespace-nowrap border-0 bg-purple-700 text-sm text-white transition-all duration-200 hover:scale-105 hover:bg-purple-800 hover:text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 active:bg-purple-900 sm:h-10 sm:text-base"
                      onClick={() => handleViewDetails(item)}
                    >
                      View Details
                    </Button>
                    <AddToCart item={item} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-zinc-300">
              No items match those filters.
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-row items-center justify-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="w-24 border-0 bg-purple-700 text-white hover:bg-purple-800 hover:text-white sm:w-auto"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm font-medium text-white sm:text-base">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="w-24 border-0 bg-purple-700 text-white hover:bg-purple-800 hover:text-white sm:w-auto"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
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

