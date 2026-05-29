import Image from 'next/image';
import { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
  Mail,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildProductImageGallery } from '@/lib/pokemon-store-images';
import { useCart } from '../CartContext';
import type { CardItem, SealedProduct } from './items-data';

interface ItemDescriptionContentProps {
  item: CardItem | SealedProduct;
}

type IconType = typeof Sparkles;

interface InfoChipProps {
  icon: IconType;
  label: string;
  value: React.ReactNode;
}

function InfoChip({ icon: Icon, label, value }: InfoChipProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.05]">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300 ring-1 ring-purple-500/20">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export function ItemDescriptionContent({ item }: ItemDescriptionContentProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const { addItem, isInCart } = useCart();

  const galleryImages = useMemo(
    () => buildProductImageGallery(item.imageUrl, item.additionalImages),
    [item.imageUrl, item.additionalImages],
  );

  const isCard = item.type === 'card';
  const card = item as CardItem;
  const sealed = item as SealedProduct;
  const displayName = isCard ? card.card : sealed.product_name;

  const goToImage = useCallback(
    (nextIndex: number) => {
      setCurrentImageIndex(nextIndex);
      setLoadedImages((prev) => {
        if (prev.has(nextIndex)) return prev;
        setIsLoading(true);
        return prev;
      });
    },
    [],
  );

  const nextImage = useCallback(() => {
    if (galleryImages.length > 0) {
      goToImage(
        currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1,
      );
    }
  }, [galleryImages.length, currentImageIndex, goToImage]);

  const prevImage = useCallback(() => {
    if (galleryImages.length > 0) {
      goToImage(
        currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1,
      );
    }
  }, [galleryImages.length, currentImageIndex, goToImage]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
    setIsLoading(false);
  }, []);

  const MainImage = useMemo(
    () => (
      <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/[0.06]">
        {isLoading && <div className="absolute inset-0 z-10 animate-pulse bg-zinc-900/80" />}
        {galleryImages.length > 0 && galleryImages[currentImageIndex] ? (
          <>
            <Image
              fill
              src={galleryImages[currentImageIndex]}
              alt={`${displayName} - Image ${currentImageIndex + 1}`}
              className={`relative z-20 object-contain p-3 transition-opacity duration-300 ${
                loadedImages.has(currentImageIndex) ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => handleImageLoad(currentImageIndex)}
              onError={() => setIsLoading(false)}
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 ring-1 ring-white/10 backdrop-blur transition-all hover:bg-black/70 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 ring-1 ring-white/10 backdrop-blur transition-all hover:bg-black/70 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        ) : item.imageUrl ? (
          <Image
            fill
            src={item.imageUrl}
            alt={displayName}
            className={`relative z-10 object-contain p-3 transition-opacity duration-300 ${
              loadedImages.has(0) ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(0)}
            onError={() => setIsLoading(false)}
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500">
            No Image
          </div>
        )}
      </div>
    ),
    [
      galleryImages,
      currentImageIndex,
      item,
      isLoading,
      loadedImages,
      handleImageLoad,
      displayName,
      nextImage,
      prevImage,
    ],
  );

  const Thumbnails = useMemo(
    () =>
      galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToImage(index)}
              className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all focus:outline-none focus-visible:ring-purple-400 sm:h-16 sm:w-16 ${
                currentImageIndex === index
                  ? 'ring-purple-400'
                  : 'ring-white/10 hover:ring-white/30'
              }`}
              aria-label={`Image ${index + 1}`}
            >
              <Image
                width={64}
                height={64}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(index)}
                quality={75}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ),
    [galleryImages, currentImageIndex, loadedImages, handleImageLoad, goToImage],
  );

  const cartDisabled = !item.is_available || isInCart(item.id);
  const cartLabel = !item.is_available
    ? 'Not Available'
    : isInCart(item.id)
      ? 'In Cart'
      : 'Add to Cart';

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.07),_transparent_55%)]"
      />

      <div className="relative grid gap-6 px-5 pb-5 pt-16 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:gap-8 md:px-7 md:pb-7 md:pt-16">
        <div className="space-y-3">
          {MainImage}
          {galleryImages.length > 1 && (
            <div className="flex justify-center">
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-300 ring-1 ring-white/10">
                Image {currentImageIndex + 1} of {galleryImages.length}
              </span>
            </div>
          )}
          {Thumbnails}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200 ring-1 ring-purple-500/30">
                {isCard ? 'Trading Card' : 'Sealed Product'}
              </span>
              {item.is_available ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-500/30">
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300 ring-1 ring-red-500/30">
                  Sold
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-[28px] md:leading-tight">
              {displayName}
            </h2>
            <p className="mt-3 text-3xl font-black tracking-tight text-purple-300 md:text-4xl">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {isCard ? (
              <>
                <InfoChip icon={Sparkles} label="Energy" value={card.energy_type} />
                <InfoChip icon={Star} label="Rarity" value={card.rarity} />
                <InfoChip icon={Layers} label="Set" value={card.set} />
                <InfoChip icon={Tag} label="PSA Grade" value={card.psa_grade} />
                <InfoChip icon={Calendar} label="Listed" value={item.uploadDate} />
              </>
            ) : (
              <>
                <InfoChip icon={Package} label="Type" value={sealed.product_type} />
                <InfoChip icon={Layers} label="Series" value={sealed.sealed_series} />
                <InfoChip icon={Calendar} label="Listed" value={item.uploadDate} />
                {sealed.packs && <InfoChip icon={Tag} label="Packs" value={sealed.packs} />}
              </>
            )}
          </div>

          {item.description && (
            <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/[0.06]">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200/70">
                About this item
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">{item.description}</p>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const event = new CustomEvent('openContactDialog');
                window.dispatchEvent(event);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <Mail className="h-4 w-4" />
              Contact Seller
            </Button>
            <Button
              type="button"
              onClick={() => !isInCart(item.id) && item.is_available && addItem(item)}
              disabled={cartDisabled}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                cartDisabled
                  ? 'bg-zinc-800 text-zinc-500 ring-1 ring-white/5 hover:bg-zinc-800'
                  : 'bg-purple-600 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/30 hover:bg-purple-500'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              {cartLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
