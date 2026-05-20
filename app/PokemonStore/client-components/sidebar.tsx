'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, X } from "lucide-react";
import { SetCodeBadge } from "@/components/set-code-badge";
import { getSvSetCodeForFilter } from "@/lib/sv-sets";
import type { Category } from "./ssr/advanced-filter";

interface SidebarProps {
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
}

const SERIES_PER_PAGE = 4;
const SETS_PER_PAGE = 4;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isDisplayActive(category: Category) {
  if (category.type === "product") return category.checked && category.id !== "all";
  if (!category.checked) return false;
  if (category.id.startsWith("All")) return false;
  if (category.id.endsWith(":AllRarities")) return false;
  return true;
}

type PillProps = {
  category: Category;
  onChange: (categoryId: string) => void;
  leading?: React.ReactNode;
  size?: "sm" | "md";
};

function Pill({ category, onChange, leading, size = "md" }: PillProps) {
  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <button
      type="button"
      onClick={() => onChange(category.id)}
      title={category.displayFullName ?? category.name}
      className={cx(
        "inline-flex items-center gap-2 rounded-full font-medium transition-all",
        sizeClasses,
        category.checked
          ? "bg-purple-600 text-white shadow-sm shadow-purple-950/40 ring-1 ring-purple-400/40"
          : "bg-white/[0.03] text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {leading}
      <span className="truncate">{category.name}</span>
    </button>
  );
}

function getPsaIconText(category: Category) {
  if (category.id === "AllPSA") return null;

  const gradeName = category.name.toLowerCase();
  if (gradeName.includes("raw") || gradeName.includes("ungraded")) return "RW";

  const grade = category.name.match(/\b(10|[1-9])\b/);
  return grade?.[1] ?? null;
}

function PsaIcon({ category }: { category: Category }) {
  const iconText = getPsaIconText(category);
  if (!iconText) return null;

  return (
    <span
      aria-hidden
      className="flex h-5 min-w-5 items-center justify-center rounded-md bg-black/40 px-1 text-[10px] font-black leading-none text-purple-100 ring-1 ring-purple-300/30"
    >
      {iconText}
    </span>
  );
}

function EnergyIcon({ category }: { category: Category }) {
  if (!category.image) return null;

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 ring-1 ring-white/10">
      <Image
        src={category.image}
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px] object-contain"
      />
    </span>
  );
}

function CheckCircle({
  checked,
  onClick,
  ariaLabel,
  size = "md",
}: {
  checked: boolean;
  onClick: () => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const icon = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="group/check inline-flex shrink-0 items-center justify-center rounded-full p-1 transition-colors hover:bg-white/5"
    >
      <span
        aria-hidden
        className={cx(
          "flex flex-shrink-0 items-center justify-center rounded-full border transition-colors",
          dim,
          checked
            ? "border-purple-300 bg-purple-300 text-[#130d24]"
            : "border-zinc-600 bg-transparent text-transparent group-hover/check:border-purple-300/70 group-hover/check:bg-purple-300/15 group-hover/check:text-purple-200/60",
        )}
      >
        <Check className={icon} strokeWidth={3} />
      </span>
    </button>
  );
}

function ProductTabs({
  categories,
  onCategoryChange,
}: {
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onCategoryChange(category.id)}
          className={cx(
            "min-w-[5rem] rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
            category.checked
              ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
              : "text-zinc-300 hover:bg-white/5 hover:text-white",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

function FilterCard({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 shadow-xl shadow-black/30">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-purple-200/80">
          {title}
          {typeof count === "number" && count > 0 && (
            <span className="rounded-full bg-purple-600/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-100 ring-1 ring-purple-400/30">
              {count}
            </span>
          )}
        </h3>
        {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function PageControls({
  page,
  totalPages,
  onChange,
  label,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="inline-flex h-7 items-center gap-1 rounded-md bg-white/[0.04] px-2 text-[11px] font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.04] disabled:hover:text-zinc-300"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev
      </button>
      <span className="text-[11px] text-zinc-400">
        {label ? `${label} ` : ""}
        Page <span className="font-semibold text-zinc-200">{page + 1}</span> of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="inline-flex h-7 items-center gap-1 rounded-md bg-white/[0.04] px-2 text-[11px] font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.04] disabled:hover:text-zinc-300"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Sidebar({ categories, onCategoryChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [seriesPage, setSeriesPage] = useState(0);
  const [setPages, setSetPages] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const grouped = useMemo(() => {
    const series = categories.filter((cat) => cat.type === "series" && cat.id !== "AllSeries");
    const sets = categories.filter((cat) => cat.type === "set");
    const rarities = categories.filter((cat) => cat.type === "rarity");
    const active = categories.filter(isDisplayActive);
    const productMode = categories.find((cat) => cat.type === "product" && cat.checked);

    return {
      active,
      mode: productMode?.name ?? "All",
      modeId: productMode?.id ?? "all",
      product: categories.filter((cat) => cat.type === "product"),
      cardsSelected: Boolean(categories.find((cat) => cat.id === "cards")?.checked),
      sealedSelected: Boolean(categories.find((cat) => cat.id === "sealed")?.checked),
      allSelected: Boolean(categories.find((cat) => cat.id === "all")?.checked),
      allSeries: categories.find((cat) => cat.id === "AllSeries"),
      allExtra: categories.find((cat) => cat.id === "AllExtra"),
      psa: categories.filter((cat) => cat.type === "psa_grade"),
      energy: categories.filter((cat) => cat.type === "energy"),
      extras: categories.filter((cat) => cat.type === "extra" && cat.id !== "AllExtra"),
      sealedTypes: categories.filter((cat) => cat.type === "sealed_type"),
      sealedSeries: categories.filter((cat) => cat.type === "sealed_series"),
      series,
      sets,
      rarities,
    };
  }, [categories]);

  const seriesStats = useMemo(() => {
    const stats = new Map<string, { setsTotal: number; setsSelected: number }>();
    grouped.series.forEach((series) => {
      const setsInSeries = grouped.sets.filter((set) => set.parentSeriesId === series.id);
      const setsSelected = setsInSeries.filter((set) => set.checked).length;
      stats.set(series.id, { setsTotal: setsInSeries.length, setsSelected });
    });
    return stats;
  }, [grouped.series, grouped.sets]);

  const seriesTotalPages = Math.max(1, Math.ceil(grouped.series.length / SERIES_PER_PAGE));
  const safeSeriesPage = Math.min(seriesPage, seriesTotalPages - 1);
  const pagedSeries = useMemo(() => {
    const start = safeSeriesPage * SERIES_PER_PAGE;
    return grouped.series.slice(start, start + SERIES_PER_PAGE);
  }, [grouped.series, safeSeriesPage]);

  useEffect(() => {
    if (seriesPage > seriesTotalPages - 1) setSeriesPage(seriesTotalPages - 1);
  }, [seriesPage, seriesTotalPages]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllSeries = () => {
    setExpandedIds(new Set(pagedSeries.map((s) => s.id)));
  };

  const collapseAllSeries = () => {
    setExpandedIds(new Set());
  };

  const setSetPage = (seriesId: string, page: number) => {
    setSetPages((current) => {
      const next = new Map(current);
      next.set(seriesId, page);
      return next;
    });
  };

  const clearAll = () => {
    onCategoryChange(grouped.modeId);
  };

  const selectedCardSeriesCount = grouped.series.filter((s) => s.checked).length;
  const selectedPsa = grouped.psa.filter((c) => c.checked && c.id !== "AllPSA").length;
  const selectedEnergy = grouped.energy.filter((c) => c.checked && c.id !== "AllEnergy").length;
  const selectedExtras = grouped.extras.filter((c) => c.checked).length;
  const selectedSealedTypes = grouped.sealedTypes.filter((c) => c.checked && c.id !== "AllSealed").length;
  const selectedSealedSeries = grouped.sealedSeries.filter((c) => c.checked && c.id !== "AllSealedSeries").length;

  return (
    <>
      <div className="relative z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-purple-400/30 bg-[#130d24]/95 px-3 py-2 text-white shadow-lg shadow-black/40 backdrop-blur transition hover:border-purple-300/60 hover:bg-[#1b1230]"
          aria-label="Open advanced filters"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-purple-50 transition group-hover:bg-purple-800">
            <Filter className="h-5 w-5" />
          </span>
          <span className="hidden pr-1 text-left sm:block">
            <span className="block text-sm font-bold leading-tight">Filters</span>
            <span className="block text-[11px] leading-tight text-zinc-400">
              {grouped.mode}
              {grouped.active.length > 0 ? ` • ${grouped.active.length}` : ""}
            </span>
          </span>
          {grouped.active.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-300 px-1 text-xs font-black text-[#130d24]">
              {grouped.active.length}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Close filters"
          />

          <div className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0613] text-white shadow-2xl shadow-black/60">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.08),_transparent_55%)]"
            />

            <header className="relative z-10 border-b border-white/10 bg-[#0a0613]/85 backdrop-blur">
              <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-200 ring-1 ring-purple-500/30">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-200/70">
                      Pokemon Store
                    </p>
                    <h2 className="text-xl font-black tracking-tight md:text-2xl">Advanced Filters</h2>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <ProductTabs categories={grouped.product} onCategoryChange={onCategoryChange} />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {grouped.active.length > 0 && (
                <div className="border-t border-white/5 bg-black/20">
                  <div className="flex flex-wrap items-center gap-1.5 px-5 py-3 md:px-8">
                    <span className="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-purple-200/70">
                      Active
                    </span>
                    {grouped.active.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onCategoryChange(cat.id)}
                        className="group inline-flex items-center gap-1.5 rounded-full bg-purple-600/90 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-purple-400/40 transition hover:bg-purple-500"
                      >
                        <span className="max-w-[14rem] truncate">{cat.displayFullName ?? cat.name}</span>
                        <X className="h-3 w-3 opacity-80 group-hover:opacity-100" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearAll}
                      className="ml-auto px-2 py-0.5 text-[11px] font-semibold text-zinc-300 underline-offset-2 hover:text-white hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto">
              <div className="px-5 py-6 md:px-8 md:py-8">
                {grouped.allSelected && (
                  <div className="mx-auto max-w-2xl rounded-2xl border border-purple-300/20 bg-purple-950/20 p-6 text-center">
                    <p className="text-base text-zinc-200">
                      Choose <span className="font-semibold text-white">Cards</span> or{" "}
                      <span className="font-semibold text-white">Sealed Products</span> above to reveal
                      deeper filters.
                    </p>
                  </div>
                )}

                {grouped.cardsSelected && !grouped.allSelected && (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <FilterCard
                      title="Series & Sets"
                      description={`Pick one or more series, drill down into sets, then narrow by rarity. Showing ${SERIES_PER_PAGE} series per page.`}
                      count={selectedCardSeriesCount}
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {grouped.allSeries && (
                            <Pill category={grouped.allSeries} onChange={onCategoryChange} />
                          )}
                          <div className="flex gap-1.5 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={expandAllSeries}
                              className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white"
                            >
                              Expand page
                            </button>
                            <button
                              type="button"
                              onClick={collapseAllSeries}
                              className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white"
                            >
                              Collapse all
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {pagedSeries.map((seriesCategory) => {
                            const stats = seriesStats.get(seriesCategory.id) ?? { setsTotal: 0, setsSelected: 0 };
                            const expanded = expandedIds.has(seriesCategory.id);
                            const setsInSeries = grouped.sets.filter(
                              (set) => set.parentSeriesId === seriesCategory.id,
                            );
                            const setTotalPages = Math.max(1, Math.ceil(setsInSeries.length / SETS_PER_PAGE));
                            const rawSetPage = setPages.get(seriesCategory.id) ?? 0;
                            const setPage = Math.min(rawSetPage, setTotalPages - 1);
                            const setStart = setPage * SETS_PER_PAGE;
                            const pagedSets = setsInSeries.slice(setStart, setStart + SETS_PER_PAGE);

                            return (
                              <div
                                key={seriesCategory.id}
                                className={cx(
                                  "overflow-hidden rounded-xl border transition-colors",
                                  seriesCategory.checked
                                    ? "border-purple-400/30 bg-purple-950/20"
                                    : "border-white/[0.06] bg-zinc-950/40",
                                )}
                              >
                                <div className="flex items-center gap-1 px-2 py-2">
                                  <CheckCircle
                                    checked={seriesCategory.checked}
                                    onClick={() => onCategoryChange(seriesCategory.id)}
                                    ariaLabel={`Select ${seriesCategory.name}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={
                                      setsInSeries.length > 0
                                        ? () => toggleExpanded(seriesCategory.id)
                                        : undefined
                                    }
                                    disabled={setsInSeries.length === 0}
                                    aria-expanded={setsInSeries.length > 0 ? expanded : undefined}
                                    className={cx(
                                      "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                                      setsInSeries.length > 0
                                        ? "hover:bg-white/[0.04]"
                                        : "cursor-default",
                                    )}
                                  >
                                    <span
                                      className={cx(
                                        "truncate text-sm font-semibold",
                                        seriesCategory.checked ? "text-white" : "text-zinc-200",
                                      )}
                                    >
                                      {seriesCategory.name}
                                    </span>
                                    <span className="flex flex-shrink-0 items-center gap-2 text-[11px] text-zinc-400">
                                      {stats.setsSelected > 0 ? (
                                        <span className="rounded-full bg-purple-600/30 px-2 py-0.5 font-bold text-purple-100 ring-1 ring-purple-400/30">
                                          {stats.setsSelected}/{stats.setsTotal}
                                        </span>
                                      ) : (
                                        stats.setsTotal > 0 && (
                                          <span>{stats.setsTotal} sets</span>
                                        )
                                      )}
                                      {setsInSeries.length > 0 && (
                                        <ChevronDown
                                          aria-hidden
                                          className={cx(
                                            "h-4 w-4 text-zinc-400 transition-transform",
                                            expanded && "rotate-180",
                                          )}
                                        />
                                      )}
                                    </span>
                                  </button>
                                </div>

                                {expanded && setsInSeries.length > 0 && (
                                  <div className="space-y-2 border-t border-white/5 bg-black/30 px-3 py-3">
                                    <div className="space-y-1.5">
                                      {pagedSets.map((setCategory) => {
                                        const raritiesInSet = grouped.rarities.filter(
                                          (rarity) => rarity.parentSetId === setCategory.id,
                                        );
                                        const visibleRarities = raritiesInSet.filter(
                                          (rarity) => !rarity.id.endsWith(":AllRarities"),
                                        );
                                        const allRaritiesOption = raritiesInSet.find((rarity) =>
                                          rarity.id.endsWith(":AllRarities"),
                                        );
                                        const setSelectedRarities = visibleRarities.filter(
                                          (r) => r.checked,
                                        ).length;
                                        const setExpanded = expandedIds.has(setCategory.id);
                                        const svCode = getSvSetCodeForFilter(
                                          seriesCategory.id,
                                          setCategory.name,
                                        );

                                        return (
                                          <div
                                            key={setCategory.id}
                                            className={cx(
                                              "rounded-lg ring-1 transition-colors",
                                              setCategory.checked
                                                ? "bg-purple-950/30 ring-purple-400/20"
                                                : "bg-white/[0.02] ring-white/5",
                                            )}
                                          >
                                            <div className="flex items-center gap-1 px-2 py-1.5">
                                              <CheckCircle
                                                checked={setCategory.checked}
                                                onClick={() => onCategoryChange(setCategory.id)}
                                                ariaLabel={`Select ${setCategory.name}`}
                                                size="sm"
                                              />
                                              <button
                                                type="button"
                                                onClick={
                                                  raritiesInSet.length > 0
                                                    ? () => toggleExpanded(setCategory.id)
                                                    : undefined
                                                }
                                                disabled={raritiesInSet.length === 0}
                                                aria-expanded={
                                                  raritiesInSet.length > 0 ? setExpanded : undefined
                                                }
                                                className={cx(
                                                  "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1 text-left transition-colors",
                                                  raritiesInSet.length > 0
                                                    ? "hover:bg-white/[0.04]"
                                                    : "cursor-default",
                                                )}
                                              >
                                                <span className="flex min-w-0 items-center gap-2">
                                                  {svCode && (
                                                    <SetCodeBadge
                                                      code={svCode}
                                                      size="sm"
                                                      title={setCategory.name}
                                                    />
                                                  )}
                                                  <span
                                                    className={cx(
                                                      "truncate text-xs font-medium",
                                                      setCategory.checked
                                                        ? "text-white"
                                                        : "text-zinc-300",
                                                    )}
                                                  >
                                                    {setCategory.name}
                                                  </span>
                                                </span>
                                                <span className="flex flex-shrink-0 items-center gap-1.5 text-[10px] text-zinc-400">
                                                  {setSelectedRarities > 0 && (
                                                    <span className="rounded-full bg-purple-600/30 px-1.5 py-0.5 font-bold text-purple-100 ring-1 ring-purple-400/30">
                                                      {setSelectedRarities}
                                                    </span>
                                                  )}
                                                  {raritiesInSet.length > 0 && (
                                                    <ChevronDown
                                                      aria-hidden
                                                      className={cx(
                                                        "h-3.5 w-3.5 text-zinc-400 transition-transform",
                                                        setExpanded && "rotate-180",
                                                      )}
                                                    />
                                                  )}
                                                </span>
                                              </button>
                                            </div>

                                            {setExpanded && raritiesInSet.length > 0 && (
                                              <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-3 py-2.5">
                                                {allRaritiesOption && (
                                                  <Pill
                                                    category={allRaritiesOption}
                                                    onChange={onCategoryChange}
                                                    size="sm"
                                                  />
                                                )}
                                                {visibleRarities.map((rarity) => (
                                                  <Pill
                                                    key={rarity.id}
                                                    category={rarity}
                                                    onChange={onCategoryChange}
                                                    size="sm"
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <PageControls
                                      page={setPage}
                                      totalPages={setTotalPages}
                                      onChange={(next) => setSetPage(seriesCategory.id, next)}
                                      label="Sets"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {grouped.series.length === 0 && (
                            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-8 text-center text-sm text-zinc-400">
                              No series available.
                            </div>
                          )}
                        </div>

                        <PageControls
                          page={safeSeriesPage}
                          totalPages={seriesTotalPages}
                          onChange={setSeriesPage}
                          label="Series"
                        />
                      </div>
                    </FilterCard>

                    <aside className="space-y-6">
                      <FilterCard title="PSA Grade" count={selectedPsa}>
                        <div className="flex flex-wrap gap-1.5">
                          {grouped.psa.map((category) => (
                            <Pill
                              key={category.id}
                              category={category}
                              onChange={onCategoryChange}
                              size="sm"
                              leading={<PsaIcon category={category} />}
                            />
                          ))}
                        </div>
                      </FilterCard>

                      <FilterCard title="Energy Type" count={selectedEnergy}>
                        <div className="flex flex-wrap gap-1.5">
                          {grouped.energy.map((category) => (
                            <Pill
                              key={category.id}
                              category={category}
                              onChange={onCategoryChange}
                              size="sm"
                              leading={<EnergyIcon category={category} />}
                            />
                          ))}
                        </div>
                      </FilterCard>

                      <FilterCard title="Other Rarities" count={selectedExtras}>
                        <div className="flex flex-wrap gap-1.5">
                          {grouped.allExtra && (
                            <Pill
                              category={grouped.allExtra}
                              onChange={onCategoryChange}
                              size="sm"
                            />
                          )}
                          {grouped.extras.map((category) => (
                            <Pill
                              key={category.id}
                              category={category}
                              onChange={onCategoryChange}
                              size="sm"
                            />
                          ))}
                        </div>
                      </FilterCard>
                    </aside>
                  </div>
                )}

                {grouped.sealedSelected && !grouped.allSelected && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <FilterCard
                      title="Product Types"
                      description="Booster boxes, ETBs, tins, and other sealed product categories."
                      count={selectedSealedTypes}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {grouped.sealedTypes.map((category) => (
                          <Pill
                            key={category.id}
                            category={category}
                            onChange={onCategoryChange}
                            size="sm"
                          />
                        ))}
                      </div>
                    </FilterCard>

                    <FilterCard
                      title="Series"
                      description="The Pokémon TCG era this sealed product belongs to."
                      count={selectedSealedSeries}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {grouped.sealedSeries.map((category) => (
                          <Pill
                            key={category.id}
                            category={category}
                            onChange={onCategoryChange}
                            size="sm"
                          />
                        ))}
                      </div>
                    </FilterCard>
                  </div>
                )}
              </div>
            </main>

            <footer className="relative z-10 border-t border-white/10 bg-[#0a0613]/85 backdrop-blur">
              <div className="flex items-center justify-between gap-3 px-5 py-3 md:px-8">
                <div className="text-xs text-zinc-400">
                  {grouped.active.length === 0 ? (
                    <>No filters applied</>
                  ) : (
                    <>
                      <span className="font-bold text-white">{grouped.active.length}</span>{" "}
                      filter{grouped.active.length === 1 ? "" : "s"} active
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {grouped.active.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-purple-950/40 transition hover:bg-purple-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
