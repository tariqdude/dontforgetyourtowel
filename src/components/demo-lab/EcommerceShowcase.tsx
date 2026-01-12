import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { demoProducts, type DemoProduct } from '../../data/demo-ecommerce';

type CartLine = {
  productId: string;
  qty: number;
  colorId: string;
  sizeId: string;
};

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirm';

type DemoFlags = {
  reducedMotion: boolean;
  perfMode: boolean;
  paused: boolean;
};

const CART_STORAGE_KEY = 'demo-lab:ecommerce-cart:v1';
const PREFS_STORAGE_KEY = 'demo-lab:ecommerce-prefs:v1';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

function getDemoFlags(): DemoFlags {
  const root = document.documentElement;
  return {
    reducedMotion:
      root.dataset.demoReducedMotion === 'true' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
    perfMode: root.dataset.demoPerf === 'true',
    paused: root.dataset.demoPaused === 'true',
  };
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    // Avoid layout shift when scrollbar disappears.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.body.classList.add('demo-ecom-open');

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      document.body.classList.remove('demo-ecom-open');
    };
  }, [locked]);
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

function useFocusTrap(enabled: boolean, dialogRef: { current: HTMLElement | null }) {
  useEffect(() => {
    if (!enabled) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = getFocusableElements(dialog);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const previousActive = document.activeElement as HTMLElement | null;
    (first ?? dialog).focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const current = document.activeElement as HTMLElement | null;
      if (!current) return;

      if (e.shiftKey) {
        if (current === first || current === dialog) {
          e.preventDefault();
          (last ?? first ?? dialog).focus?.();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          (first ?? dialog).focus?.();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousActive?.focus?.();
    };
  }, [enabled, dialogRef]);
}

function vibrateLight() {
  try {
    // Small haptic hint on supported devices.
    navigator.vibrate?.(8);
  } catch {
    // ignore
  }
}

function getProductById(id: string): DemoProduct | undefined {
  return demoProducts.find(p => p.id === id);
}

function computeLineTotal(line: CartLine) {
  const p = getProductById(line.productId);
  if (!p) return 0;
  return p.priceCents * line.qty;
}

function computeSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + computeLineTotal(l), 0);
}

function computeShipping(subtotalCents: number) {
  // A realistic demo rule: free over $100.
  return subtotalCents >= 10000 ? 0 : 995;
}

function computeTax(subtotalCents: number) {
  // Demo fixed rate.
  return Math.round(subtotalCents * 0.0825);
}

function Rating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const stars = [
    ...Array.from({ length: full }, () => 'full'),
    ...(half ? ['half'] : []),
    ...Array.from({ length: empty }, () => 'empty'),
  ];

  return (
    <span class="inline-flex items-center gap-1" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {stars.map((t, i) => (
        <span key={`${t}-${i}`} aria-hidden="true" class="text-yellow-300/90">
          {t === 'full' ? '★' : t === 'half' ? '⯪' : '☆'}
        </span>
      ))}
    </span>
  );
}

function Swatch({ color, selected, onSelect }: { color: { id: string; label: string; swatch?: string }; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      class={`min-h-touch min-w-touch inline-flex items-center justify-center rounded-full border transition ${
        selected
          ? 'border-accent-400 bg-white/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
      aria-pressed={selected}
      onClick={onSelect}
      title={color.label}
    >
      <span
        aria-hidden="true"
        class="h-5 w-5 rounded-full"
        style={{ background: color.swatch ?? '#94a3b8' }}
      />
      <span class="sr-only">{color.label}</span>
    </button>
  );
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      class={`min-h-touch inline-flex items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
        selected
          ? 'border-accent-500 bg-accent-500/15 text-white'
          : 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
      }`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

export default function EcommerceShowcase() {
  const [flags, setFlags] = useState<DemoFlags>({ reducedMotion: false, perfMode: false, paused: false });

  const [fuse, setFuse] = useState<import('fuse.js').default<DemoProduct> | null>(
    null
  );

  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [quickViewColorId, setQuickViewColorId] = useState<string>('');
  const [quickViewSizeId, setQuickViewSizeId] = useState<string>('');

  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [promoCode, setPromoCode] = useState('');

  const cartDialogRef = useRef<HTMLDivElement | null>(null);
  const quickViewDialogRef = useRef<HTMLDivElement | null>(null);

  useBodyScrollLock(cartOpen || quickViewProductId !== null);
  useFocusTrap(cartOpen, cartDialogRef);
  useFocusTrap(quickViewProductId !== null, quickViewDialogRef);

  // Load persisted state once.
  useEffect(() => {
    const savedCart = safeParseJson<CartLine[]>(localStorage.getItem(CART_STORAGE_KEY));
    if (Array.isArray(savedCart)) {
      setCartLines(savedCart);
    }

    const prefs = safeParseJson<{ tags: string[]; sort: typeof sort }>(
      localStorage.getItem(PREFS_STORAGE_KEY)
    );
    if (prefs?.tags) setSelectedTags(prefs.tags);
    if (prefs?.sort) setSort(prefs.sort);
  }, []);

  // Persist cart.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartLines));
    } catch {
      // ignore
    }
  }, [cartLines]);

  // Persist preferences.
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ tags: selectedTags, sort }));
    } catch {
      // ignore
    }
  }, [selectedTags, sort]);

  // Track demo-lab flags (pause / reduced motion / perf).
  useEffect(() => {
    const update = () => setFlags(getDemoFlags());
    update();

    const observer = new MutationObserver(() => update());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-demo-paused', 'data-demo-reduced-motion', 'data-demo-perf'] });

    return () => observer.disconnect();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    demoProducts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  useEffect(() => {
    let active = true;

    const loadFuse = async () => {
      const mod = await import('fuse.js');
      if (!active) return;

      const FuseCtor = mod.default;
      setFuse(
        new FuseCtor(demoProducts, {
          keys: [
            { name: 'name', weight: 2 },
            { name: 'brand', weight: 1 },
            { name: 'description', weight: 1 },
            { name: 'tags', weight: 1 },
          ],
          threshold: 0.35,
          minMatchCharLength: 2,
        })
      );
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => {
        void loadFuse();
      }, { timeout: 1200 });
      return () => {
        active = false;
        w.cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(() => {
      void loadFuse();
    }, 1);

    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim();

    const base =
      normalizedQuery.length >= 2 && fuse
        ? fuse.search(normalizedQuery).map(r => r.item)
        : normalizedQuery.length >= 2
          ? demoProducts.filter(p => {
              const hay = `${p.name} ${p.brand} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
              return hay.includes(normalizedQuery.toLowerCase());
            })
          : demoProducts;

    const tagFiltered = selectedTags.length
      ? base.filter(p => selectedTags.every(t => p.tags.includes(t)))
      : base;

    const sorted = [...tagFiltered];
    sorted.sort((a, b) => {
      if (sort === 'price-asc') return a.priceCents - b.priceCents;
      if (sort === 'price-desc') return b.priceCents - a.priceCents;
      // featured first, then rating.
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.rating - a.rating;
    });

    return sorted;
  }, [fuse, query, selectedTags, sort]);

  const cartCount = useMemo(() => cartLines.reduce((sum, l) => sum + l.qty, 0), [cartLines]);

  const subtotalCents = useMemo(() => computeSubtotal(cartLines), [cartLines]);
  const shippingCents = useMemo(() => computeShipping(subtotalCents), [subtotalCents]);
  const taxCents = useMemo(() => computeTax(subtotalCents), [subtotalCents]);

  const promoDiscountCents = useMemo(() => {
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) return 0;
    // Demo promo: 10% off.
    if (normalized === 'WOW10') return Math.round(subtotalCents * 0.1);
    return 0;
  }, [promoCode, subtotalCents]);

  const totalCents = useMemo(() => {
    return Math.max(0, subtotalCents - promoDiscountCents) + shippingCents + taxCents;
  }, [subtotalCents, promoDiscountCents, shippingCents, taxCents]);

  function toggleTag(tag: string) {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }

  function openQuickView(product: DemoProduct) {
    setQuickViewProductId(product.id);
    setQuickViewImageIndex(0);
    setQuickViewColorId(product.colors[0]?.id ?? '');
    setQuickViewSizeId(product.sizes[0]?.id ?? '');
  }

  function closeQuickView() {
    setQuickViewProductId(null);
    setCheckoutStep('cart');
  }

  function addToCart(product: DemoProduct, opts?: { colorId?: string; sizeId?: string; qty?: number }) {
    const colorId = opts?.colorId ?? product.colors[0]?.id ?? 'default';
    const sizeId = opts?.sizeId ?? product.sizes[0]?.id ?? 'default';
    const qty = clamp(opts?.qty ?? 1, 1, 99);

    setCartLines(prev => {
      const index = prev.findIndex(l => l.productId === product.id && l.colorId === colorId && l.sizeId === sizeId);
      if (index === -1) return [...prev, { productId: product.id, qty, colorId, sizeId }];

      const next = [...prev];
      next[index] = { ...next[index], qty: clamp(next[index].qty + qty, 1, 99) };
      return next;
    });

    vibrateLight();
  }

  function setLineQty(index: number, qty: number) {
    setCartLines(prev => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], qty: clamp(qty, 1, 99) };
      return next;
    });
  }

  function removeLine(index: number) {
    setCartLines(prev => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    setCartLines([]);
  }

  function nextImage(product: DemoProduct, dir: 1 | -1) {
    setQuickViewImageIndex(i => {
      const next = i + dir;
      if (next < 0) return product.images.length - 1;
      if (next >= product.images.length) return 0;
      return next;
    });
  }

  // Swipe handling for image carousel.
  const swipe = useRef<{ startX: number; startY: number; active: boolean } | null>(null);
  function onPointerDown(e: PointerEvent) {
    if (flags.paused) return;
    swipe.current = { startX: e.clientX, startY: e.clientY, active: true };
  }
  function onPointerUp(product: DemoProduct, e: PointerEvent) {
    const s = swipe.current;
    swipe.current = null;
    if (!s?.active) return;

    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    // Ignore vertical scrolls.
    if (Math.abs(dy) > Math.abs(dx)) return;

    if (Math.abs(dx) > 40) {
      nextImage(product, dx < 0 ? 1 : -1);
    }
  }

  const quickViewProduct = quickViewProductId ? getProductById(quickViewProductId) : undefined;

  return (
    <section
      data-ecom="root"
      data-reduced-motion={flags.reducedMotion ? 'true' : 'false'}
      data-perf={flags.perfMode ? 'true' : 'false'}
      class="relative"
    >
      <div class="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div class="space-y-2">
            <p class="font-mono text-xs uppercase tracking-widest text-zinc-400">E-commerce showcase</p>
            <h3 class="font-display text-2xl font-semibold text-white">A full shopping flow — isolated to this page</h3>
            <p class="max-w-[80ch] text-sm leading-relaxed text-zinc-300">
              Product search, filters, mobile-first gallery, quick view, cart, promo codes, and a simulated checkout.
              Nothing here touches the rest of the site.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="min-h-touch inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
              onClick={() => setCartOpen(true)}
              data-ecom="cart-button"
              aria-label={`Open cart (${cartCount} items)`}
            >
              Cart
              <span class="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs" aria-hidden="true">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              class="min-h-touch inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
              onClick={() => {
                setQuery('');
                setSelectedTags([]);
                setSort('featured');
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div class="relative" role="search">
            <label class="sr-only" htmlFor="demo-ecom-search">Search products</label>
            <input
              id="demo-ecom-search"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Search products, tags, materials…"
              aria-label="Search products"
              value={query}
              onInput={e => setQuery((e.currentTarget as HTMLInputElement).value)}
              class="min-h-touch w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:ring-2 focus:ring-accent-400"
              autoComplete="off"
              spellcheck={false}
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <label class="sr-only" for="demo-ecom-sort">Sort</label>
            <select
              id="demo-ecom-sort"
              class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-accent-400"
              value={sort}
              onChange={e => setSort((e.currentTarget as HTMLSelectElement).value as typeof sort)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {allTags.map(tag => (
            <Chip key={tag} label={tag} selected={selectedTags.includes(tag)} onToggle={() => toggleTag(tag)} />
          ))}
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(product => (
          <article key={product.id} class="rounded-2xl border border-white/10 bg-zinc-950/30 overflow-hidden">
            <button
              type="button"
              class="block w-full text-left"
              onClick={() => openQuickView(product)}
              aria-label={`Open quick view: ${product.name}`}
              data-ecom="product-open"
              data-product-id={product.id}
            >
              <div class="relative">
                <img
                  src={product.images[0]}
                  alt={`${product.name} hero`}
                  loading="lazy"
                  class="aspect-[4/3] w-full object-cover"
                />
                <div class="absolute left-3 top-3 flex flex-wrap gap-2">
                  {product.tags.slice(0, 2).map(t => (
                    <span key={t} class="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-zinc-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs text-zinc-400">{product.brand}</p>
                    <h4 class="text-base font-semibold text-white">{product.name}</h4>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-white">{formatMoney(product.priceCents)}</p>
                    {product.compareAtCents ? (
                      <p class="text-xs text-zinc-400 line-through">{formatMoney(product.compareAtCents)}</p>
                    ) : null}
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Rating value={product.rating} />
                    <span class="text-xs text-zinc-400">({product.reviewCount})</span>
                  </div>
                  <span class="text-xs text-zinc-400">Tap for details</span>
                </div>
              </div>
            </button>

            <div class="border-t border-white/10 p-4">
              <button
                type="button"
                class="min-h-touch w-full rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                onClick={() => {
                  addToCart(product);
                  setCartOpen(true);
                }}
                data-ecom="add-to-cart"
                data-product-id={product.id}
              >
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Quick view */}
      {quickViewProduct ? (
        <div class="fixed inset-0 z-[80]">
          <div class="absolute inset-0 bg-black/70" onClick={closeQuickView} aria-hidden="true" />
          <div
            class="absolute inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl border border-white/10 bg-zinc-950/95 safe-area-inset-bottom md:inset-0 md:m-auto md:max-h-[84vh] md:w-[min(980px,92vw)] md:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label={`${quickViewProduct.name} quick view`}
            ref={quickViewDialogRef}
          >
            <div class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p class="text-xs text-zinc-400">{quickViewProduct.brand}</p>
                <p class="text-base font-semibold text-white">{quickViewProduct.name}</p>
              </div>
              <button
                type="button"
                class="min-h-touch min-w-touch rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                onClick={closeQuickView}
              >
                Close
              </button>
            </div>

            <div class="grid gap-6 overflow-y-auto px-5 py-5 md:grid-cols-2">
              <div class="space-y-3">
                <div
                  class="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                  onPointerDown={e => onPointerDown(e as unknown as PointerEvent)}
                  onPointerUp={e => onPointerUp(quickViewProduct, e as unknown as PointerEvent)}
                >
                  <img
                    src={quickViewProduct.images[quickViewImageIndex]}
                    alt={`${quickViewProduct.name} image ${quickViewImageIndex + 1}`}
                    class={`aspect-[4/3] w-full object-cover ${flags.reducedMotion ? '' : 'transition-transform duration-500'} ${flags.paused ? '' : 'hover:scale-[1.02]'}`}
                    loading="eager"
                  />
                  <div class="absolute inset-x-3 bottom-3 flex items-center justify-between">
                    <button
                      type="button"
                      class="min-h-touch min-w-touch rounded-xl border border-white/10 bg-black/40 px-4 text-sm font-semibold text-white"
                      onClick={() => nextImage(quickViewProduct, -1)}
                      aria-label="Previous image"
                    >
                      Prev
                    </button>
                    <span class="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-200" aria-hidden="true">
                      {quickViewImageIndex + 1} / {quickViewProduct.images.length}
                    </span>
                    <button
                      type="button"
                      class="min-h-touch min-w-touch rounded-xl border border-white/10 bg-black/40 px-4 text-sm font-semibold text-white"
                      onClick={() => nextImage(quickViewProduct, 1)}
                      aria-label="Next image"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  {quickViewProduct.images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      class={`overflow-hidden rounded-xl border ${i === quickViewImageIndex ? 'border-accent-400' : 'border-white/10'} bg-black/20`}
                      onClick={() => setQuickViewImageIndex(i)}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img src={src} alt="" class="aspect-[4/3] w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              <div class="space-y-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <Rating value={quickViewProduct.rating} />
                      <span class="text-xs text-zinc-400">{quickViewProduct.reviewCount} reviews</span>
                    </div>
                    <p class="text-sm text-zinc-300">{quickViewProduct.description}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-semibold text-white">{formatMoney(quickViewProduct.priceCents)}</p>
                    {quickViewProduct.compareAtCents ? (
                      <p class="text-xs text-zinc-400 line-through">{formatMoney(quickViewProduct.compareAtCents)}</p>
                    ) : null}
                  </div>
                </div>

                <ul class="space-y-2 text-sm text-zinc-300">
                  {quickViewProduct.bullets.map(b => (
                    <li key={b} class="flex gap-2">
                      <span aria-hidden="true" class="text-accent-400">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Color</p>
                  <div class="flex flex-wrap gap-2">
                    {quickViewProduct.colors.map(c => (
                      <Swatch
                        key={c.id}
                        color={c}
                        selected={quickViewColorId === c.id}
                        onSelect={() => setQuickViewColorId(c.id)}
                      />
                    ))}
                  </div>
                </div>

                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Size</p>
                  <div class="flex flex-wrap gap-2">
                    {quickViewProduct.sizes.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        class={`min-h-touch min-w-touch rounded-xl border px-4 text-sm font-semibold transition ${
                          quickViewSizeId === s.id
                            ? 'border-accent-400 bg-white/10 text-white'
                            : 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                        }`}
                        aria-pressed={quickViewSizeId === s.id}
                        onClick={() => setQuickViewSizeId(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    class="min-h-touch rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                    onClick={() => {
                      addToCart(quickViewProduct, { colorId: quickViewColorId, sizeId: quickViewSizeId, qty: 1 });
                      setCartOpen(true);
                      closeQuickView();
                    }}
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    class="min-h-touch rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                    onClick={() => {
                      setCartOpen(true);
                      closeQuickView();
                    }}
                  >
                    View cart
                  </button>
                </div>

                <p class="text-xs text-zinc-500">
                  Demo checkout only. Use promo code <span class="font-mono text-zinc-300">WOW10</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cart drawer / sheet */}
      {cartOpen ? (
        <div class="fixed inset-0 z-[90]">
          <div class="absolute inset-0 bg-black/70" onClick={() => setCartOpen(false)} aria-hidden="true" />
          <div
            class="absolute inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl border border-white/10 bg-zinc-950/95 safe-area-inset-bottom md:inset-y-0 md:right-0 md:left-auto md:w-[min(520px,92vw)] md:rounded-l-3xl md:rounded-tr-none"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            ref={cartDialogRef}
            data-ecom="cart"
          >
            <div class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p class="text-base font-semibold text-white">Cart</p>
                <p class="text-xs text-zinc-400">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
              </div>
              <button
                type="button"
                class="min-h-touch min-w-touch rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                onClick={() => setCartOpen(false)}
              >
                Close
              </button>
            </div>

            <div class="max-h-[calc(92vh-72px)] overflow-y-auto px-5 py-5">
              {checkoutStep === 'cart' ? (
                <>
                  {cartLines.length === 0 ? (
                    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200">
                      Your cart is empty. Add a product to see the full checkout flow.
                    </div>
                  ) : (
                    <div class="space-y-4">
                      {cartLines.map((line, idx) => {
                        const product = getProductById(line.productId);
                        if (!product) return null;

                        const color = product.colors.find(c => c.id === line.colorId);
                        const size = product.sizes.find(s => s.id === line.sizeId);

                        return (
                          <div key={`${line.productId}-${line.colorId}-${line.sizeId}`} class="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <div class="flex gap-4">
                              <img
                                src={product.images[0]}
                                alt=""
                                class="h-20 w-24 rounded-xl object-cover border border-white/10"
                                loading="lazy"
                              />
                              <div class="flex-1">
                                <div class="flex items-start justify-between gap-3">
                                  <div>
                                    <p class="text-sm font-semibold text-white">{product.name}</p>
                                    <p class="mt-1 text-xs text-zinc-400">
                                      {color?.label ?? 'Color'} · {size?.label ?? 'Size'}
                                    </p>
                                  </div>
                                  <p class="text-sm font-semibold text-white">{formatMoney(product.priceCents * line.qty)}</p>
                                </div>

                                <div class="mt-3 flex items-center justify-between gap-3">
                                  <label class="sr-only" htmlFor={`qty-${idx}`}>Quantity</label>
                                  <input
                                    id={`qty-${idx}`}
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={99}
                                    aria-label="Quantity"
                                    value={line.qty}
                                    onInput={e => setLineQty(idx, Number((e.currentTarget as HTMLInputElement).value))}
                                    class="min-h-touch w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400"
                                    data-ecom="qty"
                                  />
                                  <button
                                    type="button"
                                    class="min-h-touch rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                                    onClick={() => removeLine(idx)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div class="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-zinc-300">Subtotal</span>
                          <span class="text-white font-semibold">{formatMoney(subtotalCents)}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-zinc-300">Promo</span>
                          <span class="text-white font-semibold">-{formatMoney(promoDiscountCents)}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-zinc-300">Shipping</span>
                          <span class="text-white font-semibold">{shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-zinc-300">Tax</span>
                          <span class="text-white font-semibold">{formatMoney(taxCents)}</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-white/10 pt-3">
                          <span class="text-sm font-semibold text-zinc-200">Total</span>
                          <span class="text-lg font-semibold text-white" data-ecom="total">{formatMoney(totalCents)}</span>
                        </div>

                        <div class="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="Promo code (WOW10)"
                            aria-label="Promo code"
                            value={promoCode}
                            onInput={e => setPromoCode((e.currentTarget as HTMLInputElement).value)}
                            class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-accent-400"
                          />
                          <button
                            type="button"
                            class="min-h-touch rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                            onClick={() => setCheckoutStep('shipping')}
                            data-ecom="checkout"
                          >
                            Checkout
                          </button>
                        </div>

                        <button
                          type="button"
                          class="min-h-touch w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                          onClick={clearCart}
                        >
                          Clear cart
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {checkoutStep === 'shipping' ? (
                <div class="space-y-4">
                  <p class="text-sm text-zinc-300">Shipping details (demo)</p>
                  <div class="grid gap-3">
                    <input aria-label="Full name" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="Full name" autoComplete="name" />
                    <input aria-label="Email" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="Email" type="email" inputMode="email" autoComplete="email" />
                    <input aria-label="Address" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="Address" autoComplete="street-address" />
                    <div class="grid grid-cols-2 gap-3">
                      <input aria-label="City" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="City" autoComplete="address-level2" />
                      <input aria-label="ZIP" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="ZIP" inputMode="numeric" autoComplete="postal-code" />
                    </div>
                  </div>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      class="min-h-touch rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      onClick={() => setCheckoutStep('cart')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      class="min-h-touch rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      onClick={() => setCheckoutStep('payment')}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {checkoutStep === 'payment' ? (
                <div class="space-y-4">
                  <p class="text-sm text-zinc-300">Payment (demo)</p>
                  <div class="grid gap-3">
                    <input aria-label="Card number" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="Card number" inputMode="numeric" autoComplete="cc-number" />
                    <div class="grid grid-cols-2 gap-3">
                      <input aria-label="Expiry date" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" />
                      <input aria-label="Security code" class="min-h-touch rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent-400" placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" />
                    </div>
                  </div>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      class="min-h-touch rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      onClick={() => setCheckoutStep('shipping')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      class="min-h-touch rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      onClick={() => setCheckoutStep('confirm')}
                    >
                      Place order
                    </button>
                  </div>
                </div>
              ) : null}

              {checkoutStep === 'confirm' ? (
                <div class="space-y-4">
                  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p class="text-base font-semibold text-white">Order confirmed (demo)</p>
                    <p class="mt-2 text-sm text-zinc-300">
                      This is a simulated checkout for demonstration purposes.
                    </p>
                    <p class="mt-3 text-sm text-zinc-200">
                      Total charged: <span class="font-semibold">{formatMoney(totalCents)}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    class="min-h-touch w-full rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400"
                    onClick={() => {
                      clearCart();
                      setCheckoutStep('cart');
                      setCartOpen(false);
                    }}
                  >
                    Back to demo
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <style>
        {`
          [data-ecom="root"][data-reduced-motion="true"] * {
            scroll-behavior: auto !important;
            transition-duration: 0ms !important;
            animation-duration: 0ms !important;
          }

          /* Keep overscroll from feeling "stuck" behind the modal on iOS. */
          .demo-ecom-open {
            overscroll-behavior: none;
          }
        `}
      </style>
    </section>
  );
}
