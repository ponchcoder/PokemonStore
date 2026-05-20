'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  PackagePlus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminGuard, AdminShell } from '../admin-auth';
import { cn } from '@/lib/utils';

type ProductType = 'card' | 'sealed';
type StatusFilter = 'all' | 'available' | 'sold';
type TypeFilter = 'all' | ProductType;

type InventoryItem = {
  id: number;
  type: ProductType;
  title: string;
  subtitle: string;
  price: number;
  imageUrl: string | null;
  is_available: boolean;
  quantity: number;
};

function asMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function AdminInventoryPage() {
  return (
    <AdminGuard>
      {({ supabase, signOut }) => <InventoryManager supabase={supabase} signOut={signOut} />}
    </AdminGuard>
  );
}

function InventoryManager({
  supabase,
  signOut,
}: {
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const loadInventory = async () => {
    const [cardsRes, sealedRes] = await Promise.all([
      supabase
        .from('CardItem')
        .select('id, card, series, set, price, imageUrl, is_available, quantity')
        .order('id', { ascending: false }),
      supabase
        .from('SealedProduct')
        .select('id, product_name, product_type, sealed_series, price, imageUrl, is_available, quantity')
        .order('id', { ascending: false }),
    ]);

    if (cardsRes.error) throw cardsRes.error;
    if (sealedRes.error) throw sealedRes.error;

    const cards: InventoryItem[] = (cardsRes.data ?? []).map((row) => ({
      id: Number(row.id),
      type: 'card',
      title: row.card || 'Unknown Card',
      subtitle: row.set || row.series || 'Unknown Set',
      price: Number(row.price || 0),
      imageUrl: row.imageUrl,
      is_available: row.is_available !== false,
      quantity: Number(row.quantity ?? 1),
    }));

    const sealed: InventoryItem[] = (sealedRes.data ?? []).map((row) => ({
      id: Number(row.id),
      type: 'sealed',
      title: row.product_name || 'Unknown Product',
      subtitle: row.sealed_series || row.product_type || 'Unknown Series',
      price: Number(row.price || 0),
      imageUrl: row.imageUrl,
      is_available: row.is_available !== false,
      quantity: Number(row.quantity ?? 1),
    }));

    setItems([...cards, ...sealed].sort((a, b) => b.id - a.id));
  };

  useEffect(() => {
    setLoading(true);
    loadInventory()
      .catch((error) => {
        setToast({
          kind: 'error',
          text: error instanceof Error ? error.message : 'Failed to load inventory',
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItemAvailability = async (item: InventoryItem) => {
    const key = `${item.type}-${item.id}`;
    setPendingId(key);
    setToast(null);
    const table = item.type === 'card' ? 'CardItem' : 'SealedProduct';
    const { error } = await supabase
      .from(table)
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (error) {
      setToast({ kind: 'error', text: error.message });
      setPendingId(null);
      return;
    }

    await loadInventory();
    setPendingId(null);
    setToast({
      kind: 'success',
      text: `${item.title} marked ${item.is_available ? 'sold' : 'available'}.`,
    });
  };

  const deleteItem = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete “${item.title}”? This permanently removes the row.`);
    if (!confirmed) return;

    const key = `${item.type}-${item.id}`;
    setPendingId(key);
    setToast(null);
    const table = item.type === 'card' ? 'CardItem' : 'SealedProduct';
    const { error } = await supabase.from(table).delete().eq('id', item.id);

    if (error) {
      setToast({ kind: 'error', text: error.message });
      setPendingId(null);
      return;
    }

    await loadInventory();
    setPendingId(null);
    setToast({ kind: 'success', text: `${item.title} deleted.` });
  };

  const counts = useMemo(() => {
    const total = items.length;
    const available = items.filter((item) => item.is_available).length;
    const sold = total - available;
    const cards = items.filter((item) => item.type === 'card').length;
    const sealed = total - cards;
    return { total, available, sold, cards, sealed };
  }, [items]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter === 'available' && !item.is_available) return false;
      if (statusFilter === 'sold' && item.is_available) return false;
      if (!query) return true;
      return [item.title, item.subtitle, item.type, String(item.id), asMoney(item.price)]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [items, search, statusFilter, typeFilter]);

  return (
    <AdminShell
      title="Inventory"
      description="Search items, mark them sold or available, and remove rows."
      onSignOut={signOut}
      action={
        <Link
          href="/admin/add"
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500"
        >
          <PackagePlus className="size-4" />
          Add New
        </Link>
      }
    >
      {toast && (
        <div
          className={cn(
            'mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm',
            toast.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              : 'border-red-500/30 bg-red-500/10 text-red-100',
          )}
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/40">
        <div className="flex flex-col gap-4 border-b border-white/5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, set, price, or ID…"
              className="h-10 border-white/10 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPills
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { id: 'all', label: 'All', count: counts.total },
                { id: 'card', label: 'Cards', count: counts.cards },
                { id: 'sealed', label: 'Sealed', count: counts.sealed },
              ]}
            />
            <FilterPills
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { id: 'all', label: 'All' },
                { id: 'available', label: 'Available', count: counts.available },
                { id: 'sold', label: 'Sold', count: counts.sold },
              ]}
            />
          </div>
        </div>

        <div className="px-4 py-3 text-xs text-zinc-500 md:px-5">
          {loading
            ? 'Loading inventory…'
            : `Showing ${visibleItems.length} of ${counts.total} items`}
        </div>

        <ul className="divide-y divide-white/5">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
            : visibleItems.map((item) => (
                <InventoryRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  pending={pendingId === `${item.type}-${item.id}`}
                  onToggle={() => updateItemAvailability(item)}
                  onDelete={() => deleteItem(item)}
                />
              ))}
        </ul>

        {!loading && visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-zinc-400">
            <Search className="size-6 text-zinc-500" />
            <p className="text-sm">No items match your filters.</p>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}

function InventoryRow({
  item,
  pending,
  onToggle,
  onDelete,
}: {
  item: InventoryItem;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="grid grid-cols-[64px_1fr] gap-4 p-4 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center md:gap-5 md:p-5">
      <div className="relative size-16 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/5 md:size-[72px]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="72px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold text-white">{item.title}</p>
          <Badge
            tone={item.type === 'card' ? 'purple' : 'indigo'}
            label={item.type === 'card' ? 'Card' : 'Sealed'}
          />
          <Badge
            tone={item.is_available ? 'emerald' : 'rose'}
            label={item.is_available ? 'Available' : 'Sold'}
          />
        </div>
        <p className="mt-1 truncate text-sm text-zinc-400">
          {item.subtitle} · ID #{item.id}
        </p>
        <p className="mt-1 text-sm font-medium text-purple-200">
          {asMoney(item.price)} · Qty {item.quantity}
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:justify-end">
        <Button
          onClick={onToggle}
          disabled={pending}
          variant="outline"
          className={cn(
            'h-9 border-white/10 bg-zinc-950/60 text-zinc-100 hover:bg-zinc-800 hover:text-white',
            'disabled:opacity-60',
          )}
        >
          {item.is_available ? 'Mark Sold' : 'Mark Available'}
        </Button>
        <Button
          onClick={onDelete}
          disabled={pending}
          variant="ghost"
          className="h-9 gap-1.5 px-3 text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className="grid grid-cols-[64px_1fr] gap-4 p-4 md:grid-cols-[72px_1fr_auto] md:items-center md:p-5">
      <div className="size-16 animate-pulse rounded-xl bg-white/5 md:size-[72px]" />
      <div className="space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
      </div>
      <div className="col-span-2 hidden gap-2 md:col-span-1 md:flex">
        <div className="h-9 w-28 animate-pulse rounded bg-white/5" />
        <div className="h-9 w-20 animate-pulse rounded bg-white/5" />
      </div>
    </li>
  );
}

const badgeTones = {
  emerald: 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/30',
  rose: 'bg-rose-500/10 text-rose-200 ring-rose-500/30',
  purple: 'bg-purple-500/10 text-purple-200 ring-purple-500/30',
  indigo: 'bg-indigo-500/10 text-indigo-200 ring-indigo-500/30',
} as const;

function Badge({ tone, label }: { tone: keyof typeof badgeTones; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1',
        badgeTones[tone],
      )}
    >
      {label}
    </span>
  );
}

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-zinc-950/60 p-1">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px]',
                  active ? 'bg-white/15 text-white' : 'bg-white/5 text-zinc-400',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
