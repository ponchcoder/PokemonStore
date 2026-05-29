export type ProductType = 'card' | 'sealed';

type InventoryBase = {
  id: number;
  price: number;
  weight: number;
  quantity: number;
  imageUrl: string | null;
  additionalImages: string | null;
  description: string;
  is_available: boolean;
  uploadDate: string;
};

export type CardInventoryItem = InventoryBase & {
  type: 'card';
  card_id: string;
  card: string;
  series: string;
  set: string;
  energy_type: string;
  rarity: string;
  other_rarities: string;
  psa_grade: string;
};

export type SealedInventoryItem = InventoryBase & {
  type: 'sealed';
  product_id: string;
  product_name: string;
  product_type: string;
  sealed_series: string;
  sealed_set: string;
  packs: number;
};

export type InventoryItem = CardInventoryItem | SealedInventoryItem;

export function getInventoryTitle(item: InventoryItem) {
  return item.type === 'card' ? item.card : item.product_name;
}

export function getInventorySubtitle(item: InventoryItem) {
  return item.type === 'card'
    ? item.set || item.series
    : item.sealed_series || item.product_type;
}

export function getInventoryCode(item: InventoryItem) {
  return item.type === 'card' ? item.card_id : item.product_id;
}
