'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinCommaSeparatedImages, parseCommaSeparatedImages } from '@/lib/pokemon-store-images';
import type { InventoryItem } from './types';

const energyOptions = [
  'Fire',
  'Water',
  'Grass',
  'Colorless',
  'Lightning',
  'Psychic',
  'Fighting',
  'Dragon',
  'Darkness',
  'Metal',
  'Fairy',
  'None',
];

type EditItemDialogProps = {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabase: SupabaseClient;
  onSaved: () => void;
};

export function EditItemDialog({
  item,
  open,
  onOpenChange,
  supabase,
  onSaved,
}: EditItemDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!item) return;
    setError('');
    setAvailable(item.is_available);
    if (item.type === 'card') {
      setForm({
        card_id: item.card_id,
        card: item.card,
        series: item.series,
        set: item.set,
        energy_type: item.energy_type,
        rarity: item.rarity,
        other_rarities: item.other_rarities,
        psa_grade: item.psa_grade,
        price: String(item.price),
        weight: String(item.weight),
        quantity: String(item.quantity),
        description: item.description,
        imageUrl: item.imageUrl ?? '',
        additionalImages: joinCommaSeparatedImages(
          parseCommaSeparatedImages(item.additionalImages),
        ) ?? '',
        uploadDate: item.uploadDate.slice(0, 10),
      });
      return;
    }
    setForm({
      product_id: item.product_id,
      product_name: item.product_name,
      product_type: item.product_type,
      sealed_series: item.sealed_series,
      sealed_set: item.sealed_set,
      packs: String(item.packs),
      price: String(item.price),
      weight: String(item.weight),
      quantity: String(item.quantity),
      description: item.description,
      imageUrl: item.imageUrl ?? '',
      additionalImages:
        joinCommaSeparatedImages(parseCommaSeparatedImages(item.additionalImages)) ?? '',
      uploadDate: item.uploadDate.slice(0, 10),
    });
  }, [item]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;

    setSaving(true);
    setError('');

    const price = Number(form.price);
    const weight = Number(form.weight);
    const quantity = Number.parseInt(form.quantity, 10);

    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be greater than 0');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setError('Weight must be greater than 0');
      setSaving(false);
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError('Quantity must be 0 or greater');
      setSaving(false);
      return;
    }

    try {
      if (item.type === 'card') {
        const { error: updateError } = await supabase
          .from('CardItem')
          .update({
            card_id: form.card_id.trim(),
            card: form.card.trim(),
            series: form.series.trim(),
            set: form.set.trim(),
            energy_type: form.energy_type,
            rarity: form.rarity.trim(),
            other_rarities: form.other_rarities
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
              .join(','),
            psa_grade: form.psa_grade.trim() || 'Ungraded',
            price,
            weight,
            quantity,
            description: form.description.trim(),
            imageUrl: form.imageUrl.trim() || null,
            additionalImages:
              joinCommaSeparatedImages(parseCommaSeparatedImages(form.additionalImages)) || null,
            uploadDate: form.uploadDate || item.uploadDate,
            is_available: available,
          })
          .eq('id', item.id);
        if (updateError) throw updateError;
      } else {
        const packs = Number.parseInt(form.packs, 10) || 0;
        const { error: updateError } = await supabase
          .from('SealedProduct')
          .update({
            product_id: form.product_id.trim(),
            product_name: form.product_name.trim(),
            product_type: form.product_type.trim(),
            sealed_series: form.sealed_series.trim(),
            sealed_set: form.sealed_set.trim(),
            packs,
            price,
            weight,
            quantity,
            description: form.description.trim(),
            imageUrl: form.imageUrl.trim() || null,
            additionalImages:
              joinCommaSeparatedImages(parseCommaSeparatedImages(form.additionalImages)) || null,
            uploadDate: form.uploadDate || item.uploadDate,
            is_available: available,
          })
          .eq('id', item.id);
        if (updateError) throw updateError;
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-900 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {item.type === 'card' ? 'Card' : 'Sealed Product'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update listing details. Price, quantity, and availability can also be changed inline in the list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {item.type === 'card' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Card name">
                <Input value={form.card ?? ''} onChange={(e) => setField('card', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Card ID">
                <Input value={form.card_id ?? ''} onChange={(e) => setField('card_id', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Series">
                <Input value={form.series ?? ''} onChange={(e) => setField('series', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Set">
                <Input value={form.set ?? ''} onChange={(e) => setField('set', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Energy">
                <select
                  value={form.energy_type ?? 'None'}
                  onChange={(e) => setField('energy_type', e.target.value)}
                  className={selectClass}
                >
                  {energyOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rarity">
                <Input value={form.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Other rarities">
                <Input
                  value={form.other_rarities ?? ''}
                  onChange={(e) => setField('other_rarities', e.target.value)}
                  className={inputClass}
                  placeholder="Full Art, Secret Rare"
                />
              </Field>
              <Field label="PSA grade">
                <Input value={form.psa_grade ?? ''} onChange={(e) => setField('psa_grade', e.target.value)} className={inputClass} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product name">
                <Input
                  value={form.product_name ?? ''}
                  onChange={(e) => setField('product_name', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Product ID">
                <Input
                  value={form.product_id ?? ''}
                  onChange={(e) => setField('product_id', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Product type">
                <Input
                  value={form.product_type ?? ''}
                  onChange={(e) => setField('product_type', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Series">
                <Input
                  value={form.sealed_series ?? ''}
                  onChange={(e) => setField('sealed_series', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Set">
                <Input value={form.sealed_set ?? ''} onChange={(e) => setField('sealed_set', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Packs">
                <Input
                  type="number"
                  value={form.packs ?? '0'}
                  onChange={(e) => setField('packs', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Price">
              <Input type="number" step="0.01" value={form.price ?? ''} onChange={(e) => setField('price', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Quantity">
              <Input type="number" value={form.quantity ?? ''} onChange={(e) => setField('quantity', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Weight (lb)">
              <Input type="number" step="0.01" value={form.weight ?? ''} onChange={(e) => setField('weight', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Main image URL">
            <Input value={form.imageUrl ?? ''} onChange={(e) => setField('imageUrl', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Additional image URLs">
            <Input
              value={form.additionalImages ?? ''}
              onChange={(e) => setField('additionalImages', e.target.value)}
              className={inputClass}
              placeholder="Comma-separated URLs"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value)}
              className="min-h-24 w-full rounded-md border border-white/10 bg-zinc-950/60 p-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Upload date">
              <Input type="date" value={form.uploadDate ?? ''} onChange={(e) => setField('uploadDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Availability">
              <button
                type="button"
                onClick={() => setAvailable((v) => !v)}
                className={`mt-1 inline-flex h-10 w-full items-center justify-center rounded-md border text-sm ${
                  available
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-zinc-700 bg-zinc-950/60 text-zinc-300'
                }`}
              >
                {available ? 'Available' : 'Sold'}
              </button>
            </Field>
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

const inputClass =
  'h-10 border-white/10 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500/40';
const selectClass =
  'h-10 w-full rounded-md border border-white/10 bg-zinc-950/60 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/40';
