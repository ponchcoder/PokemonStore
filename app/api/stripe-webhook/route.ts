import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function buffer(readable: ReadableStream<Uint8Array>) {
  const reader = readable.getReader();
  let result = new Uint8Array(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const newResult = new Uint8Array(result.length + value.length);
    newResult.set(result);
    newResult.set(value, result.length);
    result = newResult;
  }
  return Buffer.from(result);
}

function getProductMetadata(lineItem: Stripe.LineItem): Stripe.Metadata | null {
  const product = lineItem.price?.product;
  if (!product || typeof product === 'string' || ('deleted' in product && product.deleted)) return null;
  return product.metadata;
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or webhook secret' },
      { status: 400 }
    );
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const rawBody = await buffer(req.body as ReadableStream<Uint8Array>);
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    
    // Handle successful checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ['data.price.product'],
      });
      
      if (lineItems.data.length === 0) {
        return NextResponse.json({ received: true });
      }

      // Decrement quantity for each purchased item. When quantity hits zero we
      // also flip is_available so the catalog stops listing it.
      for (const item of lineItems.data) {
        const metadata = getProductMetadata(item);
        const itemId = metadata?.id;
        const table = metadata?.table || (metadata?.type === 'card' ? 'CardItem' : metadata?.type === 'sealed' ? 'SealedProduct' : null);
        const purchased = Number(item.quantity ?? 1) || 1;

        if (!itemId || !table) {
          continue;
        }

        const { data: existing, error: fetchError } = await supabase
          .from(table)
          .select('quantity')
          .eq('id', itemId)
          .single();

        if (fetchError) {
          console.error(`Error reading ${table} item ${itemId}:`, fetchError);
          continue;
        }

        const currentQty = Number(existing?.quantity ?? 0);
        const nextQty = Math.max(0, currentQty - purchased);

        const { error } = await supabase
          .from(table)
          .update({
            quantity: nextQty,
            is_available: nextQty > 0,
          })
          .eq('id', itemId);

        if (error) {
          console.error(`Error updating ${table} item ${itemId}:`, error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${(err as Error).message}` },
      { status: 400 }
    );
  }
} 