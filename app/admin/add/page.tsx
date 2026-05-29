'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CheckCircle2, ImageIcon, Sparkles, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminGuard, AdminShell } from '../admin-auth';
import {
  parseCommaSeparatedImages,
  splitImageUrlsForStorage,
} from '@/lib/pokemon-store-images';
import { cn } from '@/lib/utils';

type ProductType = 'card' | 'sealed';
type FormErrors = Record<string, string>;

type CardForm = {
  card_id: string;
  card: string;
  series: string;
  set: string;
  energy_type: string;
  rarity: string;
  other_rarities: string;
  psa_grade: string;
  price: string;
  imageUrl: string;
  additionalImages: string;
  uploadDate: string;
  description: string;
  is_available: boolean;
  weight: string;
  quantity: string;
};

type SealedForm = {
  product_id: string;
  product_name: string;
  product_type: string;
  sealed_series: string;
  sealed_set: string;
  uploadDate: string;
  price: string;
  imageUrl: string;
  additionalImages: string;
  description: string;
  packs: string;
  is_available: boolean;
  weight: string;
  quantity: string;
};

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

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const emptyCardForm: CardForm = {
  card_id: '',
  card: '',
  series: '',
  set: '',
  energy_type: 'None',
  rarity: '',
  other_rarities: '',
  psa_grade: '',
  price: '',
  imageUrl: '',
  additionalImages: '',
  uploadDate: todayDateInputValue(),
  description: '',
  is_available: true,
  weight: '',
  quantity: '',
};

const emptySealedForm: SealedForm = {
  product_id: '',
  product_name: '',
  product_type: '',
  sealed_series: '',
  sealed_set: '',
  uploadDate: todayDateInputValue(),
  price: '',
  imageUrl: '',
  additionalImages: '',
  description: '',
  packs: '',
  is_available: true,
  weight: '',
  quantity: '',
};

function buildStoragePath(file: File, prefix: ProductType) {
  const extension = file.name.split('.').pop() || 'jpg';
  return `${prefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function normalizeCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
}

function positiveNumber(value: string, field: string, errors: FormErrors) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    errors[field] = 'Must be greater than 0';
  }
  return number;
}

function nonNegativeInteger(value: string, field: string, errors: FormErrors) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 0) {
    errors[field] = 'Must be 0 or greater';
  }
  return number;
}

export default function AdminAddPage() {
  return (
    <AdminGuard>
      {({ supabase, signOut }) => <AddInventory supabase={supabase} signOut={signOut} />}
    </AdminGuard>
  );
}

function AddInventory({ supabase, signOut }: { supabase: SupabaseClient; signOut: () => Promise<void> }) {
  const [activeType, setActiveType] = useState<ProductType>('card');
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [sealedForm, setSealedForm] = useState<SealedForm>(emptySealedForm);
  const [cardImageFiles, setCardImageFiles] = useState<File[]>([]);
  const [sealedImageFiles, setSealedImageFiles] = useState<File[]>([]);
  const [cardErrors, setCardErrors] = useState<FormErrors>({});
  const [sealedErrors, setSealedErrors] = useState<FormErrors>({});

  const uploadImage = async (file: File, prefix: ProductType) => {
    const path = buildStoragePath(file, prefix);
    const { error } = await supabase.storage.from('pokemon-inventory').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from('pokemon-inventory').getPublicUrl(path).data.publicUrl;
  };

  const resolveStoredImages = async (
    files: File[],
    manualMainUrl: string,
    manualAdditionalCsv: string,
    prefix: ProductType,
  ) => {
    const fileUrls = await Promise.all(files.map((file) => uploadImage(file, prefix)));
    const extraFromField = parseCommaSeparatedImages(manualAdditionalCsv);
    const manualMain = manualMainUrl.trim();
    const ordered =
      fileUrls.length > 0
        ? [...fileUrls, ...extraFromField.filter((url) => !fileUrls.includes(url))]
        : manualMain
          ? [manualMain, ...extraFromField.filter((url) => url !== manualMain)]
          : extraFromField;
    return splitImageUrlsForStorage(ordered);
  };

  const setCardField = <K extends keyof CardForm>(key: K, value: CardForm[K]) =>
    setCardForm((prev) => ({ ...prev, [key]: value }));
  const setSealedField = <K extends keyof SealedForm>(key: K, value: SealedForm[K]) =>
    setSealedForm((prev) => ({ ...prev, [key]: value }));

  const addCard = async (event: FormEvent) => {
    event.preventDefault();
    const errors: FormErrors = {};
    if (!cardForm.card.trim()) errors.card = 'Required';
    if (!cardForm.series.trim()) errors.series = 'Required';
    if (!cardForm.set.trim()) errors.set = 'Required';
    if (!cardForm.rarity.trim()) errors.rarity = 'Required';
    const price = positiveNumber(cardForm.price, 'price', errors);
    const weight = positiveNumber(cardForm.weight, 'weight', errors);
    const quantity = nonNegativeInteger(cardForm.quantity, 'quantity', errors);
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setToast(null);
      const { imageUrl, additionalImages } = await resolveStoredImages(
        cardImageFiles,
        cardForm.imageUrl,
        cardForm.additionalImages,
        'card',
      );
      const { error } = await supabase.from('CardItem').insert({
        card_id: cardForm.card_id.trim() || `CARD-${Date.now()}`,
        card: cardForm.card.trim(),
        series: cardForm.series.trim(),
        set: cardForm.set.trim(),
        energy_type: cardForm.energy_type,
        rarity: cardForm.rarity.trim(),
        other_rarities: normalizeCommaList(cardForm.other_rarities),
        psa_grade: cardForm.psa_grade.trim() || 'Ungraded',
        price,
        imageUrl,
        additionalImages,
        uploadDate: cardForm.uploadDate || new Date().toISOString(),
        description: cardForm.description.trim(),
        is_available: cardForm.is_available,
        weight,
        quantity,
      });
      if (error) throw error;
      setCardForm(emptyCardForm);
      setCardImageFiles([]);
      setToast({ kind: 'success', text: `“${cardForm.card.trim()}” added to CardItem.` });
    } catch (error) {
      setToast({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to add card' });
    } finally {
      setSubmitting(false);
    }
  };

  const addSealed = async (event: FormEvent) => {
    event.preventDefault();
    const errors: FormErrors = {};
    if (!sealedForm.product_name.trim()) errors.product_name = 'Required';
    if (!sealedForm.product_type.trim()) errors.product_type = 'Required';
    if (!sealedForm.sealed_series.trim()) errors.sealed_series = 'Required';
    const price = positiveNumber(sealedForm.price, 'price', errors);
    const weight = positiveNumber(sealedForm.weight, 'weight', errors);
    const packs = nonNegativeInteger(sealedForm.packs, 'packs', errors);
    const quantity = nonNegativeInteger(sealedForm.quantity, 'quantity', errors);
    setSealedErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setToast(null);
      const { imageUrl, additionalImages } = await resolveStoredImages(
        sealedImageFiles,
        sealedForm.imageUrl,
        sealedForm.additionalImages,
        'sealed',
      );
      const { error } = await supabase.from('SealedProduct').insert({
        product_id: sealedForm.product_id.trim() || `SEALED-${Date.now()}`,
        product_name: sealedForm.product_name.trim(),
        product_type: sealedForm.product_type.trim(),
        sealed_series: sealedForm.sealed_series.trim(),
        sealed_set: sealedForm.sealed_set.trim(),
        uploadDate: sealedForm.uploadDate || new Date().toISOString(),
        price,
        imageUrl,
        additionalImages,
        description: sealedForm.description.trim(),
        packs,
        is_available: sealedForm.is_available,
        weight,
        quantity,
      });
      if (error) throw error;
      setSealedForm(emptySealedForm);
      setSealedImageFiles([]);
      setToast({ kind: 'success', text: `“${sealedForm.product_name.trim()}” added to SealedProduct.` });
    } catch (error) {
      setToast({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to add sealed product' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Add Inventory"
      description="Create a new CardItem or SealedProduct row. Fields mirror the database schema."
      onSignOut={signOut}
      action={
        <TypeTabs
          value={activeType}
          onChange={(value) => {
            setActiveType(value);
            setToast(null);
          }}
        />
      }
    >
      {toast && (
        <div
          className={cn(
            'mb-6 flex items-start gap-2 rounded-xl border p-3 text-sm',
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

      {activeType === 'card' ? (
        <form onSubmit={addCard} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <FormSection
              title="Identity"
              description="How this card is named and categorized in the catalog."
            >
              <Field label="Card Name" required error={cardErrors.card}>
                <FieldInput value={cardForm.card} onChange={(v) => setCardField('card', v)} placeholder="Charizard ex" />
              </Field>
              <Field label="Card ID" hint="Optional — auto-generated if blank">
                <FieldInput value={cardForm.card_id} onChange={(v) => setCardField('card_id', v)} placeholder="CARD-1234" />
              </Field>
              <Field label="Series" required error={cardErrors.series}>
                <FieldInput value={cardForm.series} onChange={(v) => setCardField('series', v)} placeholder="Scarlet & Violet" />
              </Field>
              <Field label="Set" required error={cardErrors.set}>
                <FieldInput value={cardForm.set} onChange={(v) => setCardField('set', v)} placeholder="Obsidian Flames" />
              </Field>
            </FormSection>

            <FormSection
              title="Card Details"
              description="Type, rarity and grading information."
            >
              <Field label="Energy Type">
                <Select
                  value={cardForm.energy_type}
                  onChange={(v) => setCardField('energy_type', v)}
                  options={energyOptions}
                />
              </Field>
              <Field label="Rarity" required error={cardErrors.rarity}>
                <FieldInput value={cardForm.rarity} onChange={(v) => setCardField('rarity', v)} placeholder="Ultra Rare" />
              </Field>
              <Field label="Other Rarities" hint="Comma-separated">
                <FieldInput
                  value={cardForm.other_rarities}
                  onChange={(v) => setCardField('other_rarities', v)}
                  placeholder="Holo, Reverse Holo"
                />
              </Field>
              <Field label="PSA Grade">
                <FieldInput value={cardForm.psa_grade} onChange={(v) => setCardField('psa_grade', v)} placeholder="Ungraded" />
              </Field>
            </FormSection>

            <FormSection
              title="Pricing & Shipping"
              description="Listed price and weight used to calculate shipping."
            >
              <Field label="Price (USD)" required error={cardErrors.price}>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={cardForm.price}
                  onChange={(v) => setCardField('price', v)}
                  placeholder="49.99"
                />
              </Field>
              <Field label="Quantity" required error={cardErrors.quantity}>
                <FieldInput
                  type="number"
                  step="1"
                  value={cardForm.quantity}
                  onChange={(v) => setCardField('quantity', v)}
                  placeholder="1"
                />
              </Field>
              <Field label="Weight (lb)" required error={cardErrors.weight}>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={cardForm.weight}
                  onChange={(v) => setCardField('weight', v)}
                  placeholder=".1"
                />
              </Field>
              <Field label="Upload Date" hint="Defaults to now">
                <FieldInput
                  type="date"
                  value={cardForm.uploadDate}
                  onChange={(v) => setCardField('uploadDate', v)}
                />
              </Field>
              <Field label="Availability">
                <Toggle
                  checked={cardForm.is_available}
                  onChange={(v) => setCardField('is_available', v)}
                  on="Available"
                  off="Sold"
                />
              </Field>
            </FormSection>

            <FormSection title="Description" description="Notes shown on the listing.">
              <div className="sm:col-span-2">
                <Textarea
                  value={cardForm.description}
                  onChange={(v) => setCardField('description', v)}
                  placeholder="Mint condition, no whitening on edges…"
                />
              </div>
            </FormSection>
          </div>

          <aside className="space-y-6">
            <ImageUploader
              files={cardImageFiles}
              onFilesChange={setCardImageFiles}
              urlValue={cardForm.imageUrl}
              onUrlChange={(v) => setCardField('imageUrl', v)}
              additionalImages={cardForm.additionalImages}
              onAdditionalChange={(v) => setCardField('additionalImages', v)}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Add Card to Catalog'}
            </Button>
          </aside>
        </form>
      ) : (
        <form onSubmit={addSealed} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <FormSection
              title="Identity"
              description="How this sealed product appears in the catalog."
            >
              <Field label="Product Name" required error={sealedErrors.product_name}>
                <FieldInput
                  value={sealedForm.product_name}
                  onChange={(v) => setSealedField('product_name', v)}
                  placeholder="Obsidian Flames Booster Box"
                />
              </Field>
              <Field label="Product ID" hint="Optional — auto-generated if blank">
                <FieldInput
                  value={sealedForm.product_id}
                  onChange={(v) => setSealedField('product_id', v)}
                  placeholder="SEALED-1234"
                />
              </Field>
              <Field label="Product Type" required error={sealedErrors.product_type}>
                <FieldInput
                  value={sealedForm.product_type}
                  onChange={(v) => setSealedField('product_type', v)}
                  placeholder="Booster Box"
                />
              </Field>
              <Field label="Series" required error={sealedErrors.sealed_series}>
                <FieldInput
                  value={sealedForm.sealed_series}
                  onChange={(v) => setSealedField('sealed_series', v)}
                  placeholder="Scarlet & Violet"
                />
              </Field>
              <Field label="Set">
                <FieldInput
                  value={sealedForm.sealed_set}
                  onChange={(v) => setSealedField('sealed_set', v)}
                  placeholder="Obsidian Flames"
                />
              </Field>
              <Field label="Pack Count" error={sealedErrors.packs}>
                <FieldInput
                  type="number"
                  value={sealedForm.packs}
                  onChange={(v) => setSealedField('packs', v)}
                  placeholder="36"
                />
              </Field>
            </FormSection>

            <FormSection
              title="Pricing & Shipping"
              description="Listed price and weight used to calculate shipping."
            >
              <Field label="Price (USD)" required error={sealedErrors.price}>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={sealedForm.price}
                  onChange={(v) => setSealedField('price', v)}
                  placeholder="149.99"
                />
              </Field>
              <Field label="Quantity" required error={sealedErrors.quantity}>
                <FieldInput
                  type="number"
                  step="1"
                  value={sealedForm.quantity}
                  onChange={(v) => setSealedField('quantity', v)}
                  placeholder="1"
                />
              </Field>
              <Field label="Weight (lb)" required error={sealedErrors.weight}>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={sealedForm.weight}
                  onChange={(v) => setSealedField('weight', v)}
                  placeholder="1.5"
                />
              </Field>
              <Field label="Upload Date" hint="Defaults to now">
                <FieldInput
                  type="date"
                  value={sealedForm.uploadDate}
                  onChange={(v) => setSealedField('uploadDate', v)}
                />
              </Field>
              <Field label="Availability">
                <Toggle
                  checked={sealedForm.is_available}
                  onChange={(v) => setSealedField('is_available', v)}
                  on="Available"
                  off="Sold"
                />
              </Field>
            </FormSection>

            <FormSection title="Description" description="Notes shown on the listing.">
              <div className="sm:col-span-2">
                <Textarea
                  value={sealedForm.description}
                  onChange={(v) => setSealedField('description', v)}
                  placeholder="Factory sealed booster box, never opened…"
                />
              </div>
            </FormSection>
          </div>

          <aside className="space-y-6">
            <ImageUploader
              files={sealedImageFiles}
              onFilesChange={setSealedImageFiles}
              urlValue={sealedForm.imageUrl}
              onUrlChange={(v) => setSealedField('imageUrl', v)}
              additionalImages={sealedForm.additionalImages}
              onAdditionalChange={(v) => setSealedField('additionalImages', v)}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Add Sealed Product'}
            </Button>
          </aside>
        </form>
      )}
    </AdminShell>
  );
}

function TypeTabs({ value, onChange }: { value: ProductType; onChange: (value: ProductType) => void }) {
  const tabs = [
    { id: 'card' as const, label: 'Card', icon: Sparkles },
    { id: 'sealed' as const, label: 'Sealed Product', icon: Package },
  ];
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-zinc-900/70 p-1">
      {tabs.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-purple-600 text-white shadow'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/40 md:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-zinc-400">{description}</p> : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-zinc-200">
          {label}
          {required ? <span className="ml-1 text-red-400">*</span> : null}
        </Label>
        {hint && !error ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function FieldInput({
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <Input
      type={type}
      step={step}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 border-white/10 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500/40"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full appearance-none rounded-md border border-white/10 bg-zinc-950/60 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/40"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-zinc-900">
          {option}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-32 w-full resize-y rounded-md border border-white/10 bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-purple-500/40"
    />
  );
}

function Toggle({
  checked,
  onChange,
  on,
  off,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  on: string;
  off: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
        checked
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-zinc-700 bg-zinc-950/60 text-zinc-300',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          checked ? 'bg-emerald-400' : 'bg-zinc-500',
        )}
      />
      {checked ? on : off}
    </button>
  );
}

function ImageUploader({
  files,
  onFilesChange,
  urlValue,
  onUrlChange,
  additionalImages,
  onAdditionalChange,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  urlValue: string;
  onUrlChange: (value: string) => void;
  additionalImages: string;
  onAdditionalChange: (value: string) => void;
}) {
  const previews = useMultiFilePreviews(files);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    onFilesChange([...files, ...Array.from(incoming)]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/40">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-white">Photos</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Upload multiple images. The first photo is the main image on the shop; the rest appear in View Details.
        </p>
      </header>

      {previews.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {previews.map((preview, index) => (
            <div
              key={`${preview.url}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-zinc-950/60"
            >
              <Image src={preview.url} alt={preview.name} fill sizes="160px" className="object-contain" unoptimized />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {index === 0 ? 'Main' : `#${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1.5 top-1.5 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-zinc-950/60 text-zinc-500">
          <ImageIcon className="size-10" />
          <span className="text-xs">No photos selected</span>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
          />
          {files.length > 0 ? 'Add more photos' : 'Upload photos'}
        </label>

        <Field label="Or main image URL" hint="Used if you upload no files">
          <FieldInput value={urlValue} onChange={onUrlChange} placeholder="https://…" />
        </Field>

        <Field label="Extra image URLs" hint="Comma-separated; merged with uploaded photos">
          <FieldInput
            value={additionalImages}
            onChange={onAdditionalChange}
            placeholder="https://…, https://…"
          />
        </Field>
      </div>
    </section>
  );
}

function useMultiFilePreviews(files: File[]) {
  const previews = useMemo(() => {
    if (typeof URL === 'undefined') return [];
    return files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return previews;
}
