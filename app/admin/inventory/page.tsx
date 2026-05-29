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
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminGuard, AdminShell } from '../admin-auth';
import { cn } from '@/lib/utils';
import { EditItemDialog } from './edit-item-dialog';
import {
  getInventoryCode,
  getInventorySubtitle,
  getInventoryTitle,
  type InventoryItem,
  type ProductType,
} from './types';

type StatusFilter = 'all' | 'available' | 'sold';
type TypeFilter = 'all' | ProductType;

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
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadInventory = async () => {
    const [cardsRes, sealedRes] = await Promise.all([
      supabase
        .from('CardItem')
        .select(
          'id, card_id, card, series, set, energy_type, rarity, other_rarities, psa_grade, price, weight, quantity, imageUrl, additionalImages, description, is_available, uploadDate',
        )
        .order('id', { ascending: false }),
      supabase
        .from('SealedProduct')
        .select(
          'id, product_id, product_name, product_type, sealed_series, sealed_set, packs, price, weight, quantity, imageUrl, additionalImages, description, is_available, uploadDate',
        )
        .order('id', { ascending: false }),
    ]);

    if (cardsRes.error) throw cardsRes.error;
    if (sealedRes.error) throw sealedRes.error;

    const cards: InventoryItem[] = (cardsRes.data ?? []).map((row) => ({
      id: Number(row.id),
      type: 'card' as const,
      card_id: row.card_id || '',
      card: row.card || 'Unknown Card',
      series: row.series || '',
      set: row.set || '',
      energy_type: row.energy_type || 'None',
      rarity: row.rarity || '',
      other_rarities: row.other_rarities || '',
      psa_grade: row.psa_grade || 'Ungraded',
      price: Number(row.price || 0),
      weight: Number(row.weight || 0),
      quantity: Number(row.quantity ?? 1),
      imageUrl: row.imageUrl,
      additionalImages: row.additionalImages,
      description: row.description || '',
      is_available: row.is_available !== false,
      uploadDate: row.uploadDate || new Date().toISOString(),
    }));

    const sealed: InventoryItem[] = (sealedRes.data ?? []).map((row) => ({
      id: Number(row.id),
      type: 'sealed' as const,
      product_id: row.product_id || '',
      product_name: row.product_name || 'Unknown Product',
      product_type: row.product_type || '',
      sealed_series: row.sealed_series || '',
      sealed_set: row.sealed_set || '',
      packs: Number(row.packs ?? 0),
      price: Number(row.price || 0),
      weight: Number(row.weight || 0),
      quantity: Number(row.quantity ?? 1),
      imageUrl: row.imageUrl,
      additionalImages: row.additionalImages,
      description: row.description || '',
      is_available: row.is_available !== false,
      uploadDate: row.uploadDate || new Date().toISOString(),
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

  const updateQuickFields = async (
    item: InventoryItem,
    fields: { price?: number; quantity?: number; is_available?: boolean },
  ) => {
    const key = `${item.type}-${item.id}`;
    setPendingId(key);
    setToast(null);
    const table = item.type === 'card' ? 'CardItem' : 'SealedProduct';
    const { error } = await supabase.from(table).update(fields).eq('id', item.id);

    if (error) {
      setToast({ kind: 'error', text: error.message });
      setPendingId(null);
      return;
    }

    await loadInventory();
    setPendingId(null);
    setToast({ kind: 'success', text: 'Inventory updated.' });
  };

  const toggleAvailability = (item: InventoryItem) => {
    updateQuickFields(item, { is_available: !item.is_available });
  };

  const deleteItem = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete “${getInventoryTitle(item)}”? This permanently removes the row.`);
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
    setToast({ kind: 'success', text: `${getInventoryTitle(item)} deleted.` });
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
      return [
        getInventoryTitle(item),
        getInventorySubtitle(item),
        getInventoryCode(item),
        item.type,
        String(item.id),
        asMoney(item.price),
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [items, search, statusFilter, typeFilter]);

  return (
    <AdminShell
      title="Inventory"
      description="Quick edits for price and quantity, or open Edit for full listing changes."
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
              placeholder="Search name, card ID, set, price…"
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
          {loading ? 'Loading inventory…' : `Showing ${visibleItems.length} of ${counts.total} items`}
        </div>

        <ul className="divide-y divide-white/5">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
            : visibleItems.map((item) => (
                <InventoryRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  pending={pendingId === `${item.type}-${item.id}`}
                  onToggle={() => toggleAvailability(item)}
                  onDelete={() => deleteItem(item)}
                  onEdit={() => {
                    setEditItem(item);
                    setEditOpen(true);
                  }}
                  onSaveQuick={(price, quantity) => updateQuickFields(item, { price, quantity })}
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

      <EditItemDialog
        item={editItem}
        open={editOpen}
        onOpenChange={setEditOpen}
        supabase={supabase}
        onSaved={() => {
          loadInventory().catch(() => undefined);
          setToast({ kind: 'success', text: 'Item updated.' });
        }}
      />
    </AdminShell>
  );
}

function InventoryRow({
  item,
  pending,
  onToggle,
  onDelete,
  onEdit,
  onSaveQuick,
}: {
  item: InventoryItem;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSaveQuick: (price: number, quantity: number) => void;
}) {
  const [priceDraft, setPriceDraft] = useState(String(item.price));
  const [qtyDraft, setQtyDraft] = useState(String(item.quantity));

  useEffect(() => {
    setPriceDraft(String(item.price));
    setQtyDraft(String(item.quantity));
  }, [item.price, item.quantity]);

  const commitQuick = () => {
    const price = Number(priceDraft);
    const quantity = Number.parseInt(qtyDraft, 10);
    if (!Number.isFinite(price) || price <= 0) return;
    if (!Number.isInteger(quantity) || quantity < 0) return;
    if (price === item.price && quantity === item.quantity) return;
    onSaveQuick(price, quantity);
  };

  return (
    <li className="grid gap-4 p-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 md:p-5">
      <div className="relative mx-auto size-16 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/5 md:mx-0 md:size-[72px]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={getInventoryTitle(item)} fill sizes="72px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-white">{getInventoryTitle(item)}</p>
            <Badge tone={item.type === 'card' ? 'purple' : 'indigo'} label={item.type === 'card' ? 'Card' : 'Sealed'} />
            <Badge tone={item.is_available ? 'emerald' : 'rose'} label={item.is_available ? 'Available' : 'Sold'} />
          </div>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-purple-300/90">
            {item.type === 'card' ? 'Card ID' : 'Product ID'}: {getInventoryCode(item)}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-400">
            {getInventorySubtitle(item)} · Row #{item.id}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Price</span>
            <Input
              type="number"
              step="0.01"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={commitQuick}
              disabled={pending}
              className="h-9 w-24 border-white/10 bg-zinc-950/60 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Qty</span>
            <Input
              type="number"
              value={qtyDraft}
              onChange={(e) => setQtyDraft(e.target.value)}
              onBlur={commitQuick}
              disabled={pending}
              className="h-9 w-16 border-white/10 bg-zinc-950/60 text-white"
            />
          </label>
          <span className="pb-2 text-xs text-zinc-500">Listed {asMoney(item.price)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onToggle}
            disabled={pending}
            variant="outline"
            size="sm"
            className="h-9 border-white/10 bg-zinc-950/60 text-zinc-100 hover:bg-zinc-800"
          >
            {item.is_available ? 'Mark Sold' : 'Mark Available'}
          </Button>
          <Button
            onClick={onEdit}
            disabled={pending}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-white/10 bg-zinc-950/60 text-zinc-100 hover:bg-zinc-800"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            disabled={pending}
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 px-3 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className="grid grid-cols-[64px_1fr] gap-4 p-4 md:grid-cols-[72px_1fr] md:p-5">
      <div className="size-16 animate-pulse rounded-xl bg-white/5 md:size-[72px]" />
      <div className="space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-9 w-40 animate-pulse rounded bg-white/5" />
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
