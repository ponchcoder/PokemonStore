'use client';

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ItemGrid from "@/app/PokemonStore/client-components/grid-ui";
import Sidebar from "@/app/PokemonStore/client-components/sidebar";
import Header from "@/app/PokemonStore/client-components/header";
import { NavigationMenu } from "@/app/PokemonStore/client-components/navigation-menu";
import {
  addDynamicCategories,
  Category,
  ensureDefaultSelection,
  initialCategories,
  updateCategories,
} from "@/app/PokemonStore/client-components/ssr/advanced-filter";
import darkbanette from "@/public/darkbanette.png";
import RecentlyAdded from "@/app/PokemonStore/client-components/recently-added";
import { PokemonGenerator } from "@/app/PokemonStore/client-components/pokemon-generator";
import type { PokemonStoreItem } from "@/lib/pokemon-store-items";

interface PokemonStoreClientProps {
  initialItems: PokemonStoreItem[];
}

function getBaseCategories(items: PokemonStoreItem[]) {
  return ensureDefaultSelection(addDynamicCategories(initialCategories, items));
}

export default function PokemonStoreClient({ initialItems }: PokemonStoreClientProps) {
  const [categories, setCategories] = useState<Category[]>(() => getBaseCategories(initialItems));

  const handleCategoryChange = useCallback((categoryId: string) => {
    setCategories((currentCategories) => {
      const updatedCategories = updateCategories(currentCategories, categoryId);
      if (categoryId === "all" || categoryId === "cards" || categoryId === "sealed") {
        return ensureDefaultSelection(updatedCategories);
      }
      return updatedCategories;
    });
  }, []);

  const selectedCategories = useMemo(
    () => categories.filter((category) => category.checked),
    [categories]
  );

  const recentItems = useMemo(() => initialItems.slice(0, 10), [initialItems]);

  return (
    <div className="flex min-h-screen max-w-screen flex-col bg-[#130d24] p-2 pb-30 md:p-5">
      <Header />
      <NavigationMenu />

      <div className="relative z-20 mb-8 flex justify-center sm:mb-4">
        <PokemonGenerator />
      </div>

      <div className="relative">
        <RecentlyAdded items={recentItems} loading={false} className="relative z-10 mb-0" />
        <div className="-mt-30 flex w-full justify-center">
          <Image
            src={darkbanette}
            alt="Dark Banette"
            className="h-auto w-full max-w-[800px] rounded-lg object-contain opacity-30"
            width={800}
            priority
          />
        </div>
      </div>

      <div className="sticky top-3 z-40 -mb-15 mt-2 w-fit">
        <Sidebar categories={categories} onCategoryChange={handleCategoryChange} />
      </div>

      <div id="item-grid" className="-mt-4 flex flex-1 flex-col gap-3 md:gap-4">
        <div className="h-full flex-1 py-4">
          <ItemGrid
            items={initialItems}
            loading={false}
            selectedCategories={selectedCategories}
          />
        </div>
      </div>
    </div>
  );
}
