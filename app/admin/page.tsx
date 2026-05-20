'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowRight, Boxes, CheckCircle2, Layers, PackagePlus, XCircle } from 'lucide-react';
import { AdminGuard, AdminShell } from './admin-auth';

type Stats = {
  cards: number;
  cardsAvailable: number;
  sealed: number;
  sealedAvailable: number;
};

const initialStats: Stats = { cards: 0, cardsAvailable: 0, sealed: 0, sealedAvailable: 0 };

export default function AdminPage() {
  return (
    <AdminGuard>
      {({ supabase, signOut }) => <AdminDashboard supabase={supabase} signOut={signOut} />}
    </AdminGuard>
  );
}

function AdminDashboard({ supabase, signOut }: { supabase: SupabaseClient; signOut: () => Promise<void> }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const [cardsAll, cardsAvail, sealedAll, sealedAvail] = await Promise.all([
          supabase.from('CardItem').select('id', { count: 'exact', head: true }),
          supabase.from('CardItem').select('id', { count: 'exact', head: true }).eq('is_available', true),
          supabase.from('SealedProduct').select('id', { count: 'exact', head: true }),
          supabase.from('SealedProduct').select('id', { count: 'exact', head: true }).eq('is_available', true),
        ]);

        if (cancelled) return;
        setStats({
          cards: cardsAll.count ?? 0,
          cardsAvailable: cardsAvail.count ?? 0,
          sealed: sealedAll.count ?? 0,
          sealedAvailable: sealedAvail.count ?? 0,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const totalItems = stats.cards + stats.sealed;
  const totalAvailable = stats.cardsAvailable + stats.sealedAvailable;
  const totalSold = totalItems - totalAvailable;

  return (
    <AdminShell
      title="Dashboard"
      description="A quick snapshot of your store and shortcuts to manage it."
      onSignOut={signOut}
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Items" value={totalItems} icon={Layers} loading={loading} accent="purple" />
        <StatCard label="Available" value={totalAvailable} icon={CheckCircle2} loading={loading} accent="emerald" />
        <StatCard label="Sold" value={totalSold} icon={XCircle} loading={loading} accent="rose" />
        <StatCard
          label="Cards / Sealed"
          value={`${stats.cards} / ${stats.sealed}`}
          icon={Boxes}
          loading={loading}
          accent="indigo"
        />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <ActionCard
          href="/admin/add"
          icon={PackagePlus}
          title="Add Items"
          description="Create new card or sealed product entries with full schema fields."
        />
        <ActionCard
          href="/admin/inventory"
          icon={Boxes}
          title="Manage Inventory"
          description="Search, mark sold or available, and remove items."
        />
      </section>
    </AdminShell>
  );
}

const accentMap = {
  purple: 'bg-purple-500/10 text-purple-300 ring-purple-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  indigo: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/30',
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Layers;
  loading: boolean;
  accent: keyof typeof accentMap;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</span>
        <span className={`flex size-8 items-center justify-center rounded-lg ring-1 ${accentMap[accent]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
        {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/5" /> : value}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof PackagePlus;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl shadow-black/40 transition-colors hover:border-purple-500/40 hover:bg-zinc-900"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-600/15 text-purple-200 ring-1 ring-purple-500/30">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <ArrowRight className="size-4 translate-x-0 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-200" />
        </div>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </Link>
  );
}
