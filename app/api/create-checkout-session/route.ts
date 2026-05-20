import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

interface RequestedCartItem {
  id: number;
  type: 'card' | 'sealed';
}

interface TrustedCheckoutItem {
  id: number;
  type: 'card' | 'sealed';
  name: string;
  price: number;
  weight: number;
  card_id?: string;
  product_id?: string;
  set?: string;
  series?: string;
  sealed_series?: string;
  psa_grade?: string;
}

const CARDS_TABLE = 'CardItem';
const SEALED_TABLE = 'SealedProduct';
const MINIMUM_PURCHASE = 5;
const GENERIC_CHECKOUT_ERROR = 'Checkout is temporarily unavailable. Please try again or contact us.';

class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

function isRequestedCartItem(item: RequestedCartItem): item is RequestedCartItem {
  return (
    Number.isInteger(item.id) &&
    item.id > 0 &&
    (item.type === 'card' || item.type === 'sealed')
  );
}

function calculateShipping(items: TrustedCheckoutItem[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight >= 2) return 10;
  if (totalWeight >= 1.5) return 8;
  return 5;
}

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function getTrustedCheckoutItems(requestedItems: RequestedCartItem[]): Promise<TrustedCheckoutItem[]> {
  const supabase = getServerSupabase();
  if (!supabase) {
    throw new Error('Checkout Supabase client is not configured');
  }

  const cardIds = requestedItems.filter((item) => item.type === 'card').map((item) => item.id);
  const sealedIds = requestedItems.filter((item) => item.type === 'sealed').map((item) => item.id);

  const [cardsRes, sealedRes] = await Promise.all([
    cardIds.length
      ? supabase
          .from(CARDS_TABLE)
          .select('id, card_id, card, price, weight, quantity, set, series, psa_grade, is_available')
          .in('id', cardIds)
      : Promise.resolve({ data: [], error: null }),
    sealedIds.length
      ? supabase
          .from(SEALED_TABLE)
          .select('id, product_id, product_name, price, weight, quantity, sealed_series, is_available')
          .in('id', sealedIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cardsRes.error) throw new Error(`Failed to verify card inventory: ${cardsRes.error.message}`);
  if (sealedRes.error) throw new Error(`Failed to verify sealed inventory: ${sealedRes.error.message}`);

  const cardsById = new Map((cardsRes.data ?? []).map((row) => [Number(row.id), row]));
  const sealedById = new Map((sealedRes.data ?? []).map((row) => [Number(row.id), row]));

  return requestedItems.map((item) => {
    if (item.type === 'card') {
      const row = cardsById.get(item.id);
      if (!row) {
        throw new CheckoutError('One or more cards are no longer available');
      }

      const available = row.is_available !== false && Number(row.quantity ?? 1) > 0;
      if (!available) {
        throw new CheckoutError('One or more cards are no longer available');
      }

      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0 || !row.card) {
        throw new CheckoutError('One or more cards cannot be checked out');
      }

      return {
        id: Number(row.id),
        type: 'card',
        name: row.card,
        price,
        weight: Number(row.weight || 0),
        card_id: row.card_id || '',
        set: row.set || '',
        series: row.series || '',
        psa_grade: row.psa_grade || '',
      };
    }

    const row = sealedById.get(item.id);
    if (!row) {
      throw new CheckoutError('One or more sealed products are no longer available');
    }

    const available = row.is_available !== false && Number(row.quantity ?? 1) > 0;
    if (!available) {
      throw new CheckoutError('One or more sealed products are no longer available');
    }

    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0 || !row.product_name) {
      throw new CheckoutError('One or more sealed products cannot be checked out');
    }

    return {
      id: Number(row.id),
      type: 'sealed',
      name: row.product_name,
      price,
      weight: Number(row.weight || 0),
      product_id: row.product_id || '',
      sealed_series: row.sealed_series || '',
    };
  });
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json() as { items: RequestedCartItem[] };
    const origin = req.headers.get('origin');

    if (!origin) {
      return NextResponse.json({ error: 'Missing request origin' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const validItems = items.filter(isRequestedCartItem);
    if (validItems.length !== items.length) {
      return NextResponse.json({ error: 'Cart contains invalid items' }, { status: 400 });
    }

    const trustedItems = await getTrustedCheckoutItems(validItems);
    const subtotal = trustedItems.reduce((sum, item) => sum + item.price, 0);
    if (subtotal < MINIMUM_PURCHASE) {
      return NextResponse.json({ error: `Minimum purchase amount of $${MINIMUM_PURCHASE} is required` }, { status: 400 });
    }
    const shippingCost = calculateShipping(trustedItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        ...trustedItems.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              metadata: {
                id: String(item.id),
                type: item.type,
                table: item.type === 'card' ? CARDS_TABLE : SEALED_TABLE,
                card_id: item.card_id || '',
                product_id: item.product_id || '',
                set: item.set || '',
                series: item.series || '',
                sealed_series: item.sealed_series || '',
                psa_grade: item.psa_grade || '',
              },
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: 1,
        })),
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping Fee',
            },
            unit_amount: Math.round(shippingCost * 100),
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/PokemonStore?canceled=true`,
      automatic_tax: { enabled: process.env.STRIPE_ENABLE_AUTOMATIC_TAX === 'true' },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: 'Thank you for your purchase!',
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error instanceof CheckoutError ? error.message : GENERIC_CHECKOUT_ERROR },
      { status: 500 }
    );
  }
} 