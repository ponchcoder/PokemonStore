import { getSupabase } from './supabase';
import { CardItem, SealedProduct } from '../app/PokemonStore/client-components/ssr/items-data';

const CARDS_TABLE = 'CardItem';
const SEALED_TABLE = 'SealedProduct';

const CARD_COLUMNS = [
  'id',
  'card_id',
  'card',
  'series',
  'set',
  'energy_type',
  'rarity',
  'other_rarities',
  'psa_grade',
  'price',
  'imageUrl',
  'additionalImages',
  'uploadDate',
  'description',
  'is_available',
  'weight',
  'quantity',
].join(',');

const SEALED_COLUMNS = [
  'id',
  'product_id',
  'product_name',
  'product_type',
  'sealed_series',
  'sealed_set',
  'uploadDate',
  'price',
  'imageUrl',
  'additionalImages',
  'description',
  'packs',
  'is_available',
  'weight',
  'quantity',
].join(',');

type ItemWithJsonFields = CardItem | SealedProduct;

function parseJsonFields(item: ItemWithJsonFields) {
  const safeParse = (value: string | string[] | (string | null)[] | null): (string | null)[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      if (value.includes(',')) {
        return value.split(',').map((v: string) => v.trim()).filter(v => v.length > 0);
      }
      return [value];
    }
  };

  if (item.additionalImages !== null && item.additionalImages !== undefined) {
    item.additionalImages = safeParse(item.additionalImages);
  } else {
    item.additionalImages = [];
  }

  if (item.type === 'card') {
    const cardItem = item as CardItem;
    if (cardItem.other_rarities === null || cardItem.other_rarities === undefined) {
      cardItem.other_rarities = [];
    } else if (typeof cardItem.other_rarities === 'string') {
      cardItem.other_rarities = safeParse(cardItem.other_rarities) as string[];
    } else if (!Array.isArray(cardItem.other_rarities)) {
      cardItem.other_rarities = [String(cardItem.other_rarities)];
    }
    cardItem.other_rarities = cardItem.other_rarities
      .filter(Boolean)
      .map(value => String(value).trim())
      .filter(value => value.length > 0);
  }

  return item;
}

function asCard(row: object): CardItem {
  return parseJsonFields({ ...row, type: 'card' } as CardItem) as CardItem;
}

function asSealed(row: object): SealedProduct {
  return parseJsonFields({ ...row, type: 'sealed' } as SealedProduct) as SealedProduct;
}

export async function getAllItems(): Promise<(CardItem | SealedProduct)[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const [cardsRes, sealedRes] = await Promise.all([
      supabase
        .from(CARDS_TABLE)
        .select(CARD_COLUMNS)
        .order('id', { ascending: false }),
      supabase
        .from(SEALED_TABLE)
        .select(SEALED_COLUMNS)
        .order('id', { ascending: false }),
    ]);

    if (cardsRes.error) console.error('Error fetching cards:', cardsRes.error);
    if (sealedRes.error) console.error('Error fetching sealed products:', sealedRes.error);

    const cards = (cardsRes.data ?? []).map((row) => asCard(row));
    const sealed = (sealedRes.data ?? []).map((row) => asSealed(row));

    // Both arrays are sorted desc by id from the server. Merge them in O(n+m)
    // while preserving "newest id first" without an additional Array.sort pass.
    const merged: (CardItem | SealedProduct)[] = [];
    let i = 0;
    let j = 0;
    while (i < cards.length && j < sealed.length) {
      if (Number(cards[i].id) >= Number(sealed[j].id)) {
        merged.push(cards[i++]);
      } else {
        merged.push(sealed[j++]);
      }
    }
    while (i < cards.length) merged.push(cards[i++]);
    while (j < sealed.length) merged.push(sealed[j++]);

    return merged.filter(
      (item) =>
        item?.id &&
        item.type &&
        (item.type === 'card'
          ? (item as CardItem).card
          : (item as SealedProduct).product_name)
    );
  } catch (error) {
    console.error('Error in getAllItems:', error);
    return [];
  }
}
