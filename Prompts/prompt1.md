# 2026 Master Evolution Prompt — dontforgetyourtowel (Site-Wide + E‑commerce Expansion)

> **Purpose:** This is a repo-specific, engineering-grade prompt to drive a 2026-level upgrade across the **entire site**, **not only the e‑commerce demo**. The e‑commerce system is an additive pillar that must integrate into the site’s navigation, content, analytics, design language, testing, performance, accessibility, and deployment constraints.

> **Repo:** `tariqdude/dontforgetyourtowel` (Astro + Tailwind + TypeScript, static output for GitHub Pages).
>
> **Core philosophy:** **Static First, Dynamic Feel**. Everything must work with JS disabled; JS enhances.

## Quick navigation (for agents)

- 0. Role & quality bar
- 1. Non-negotiables (static/base-path/a11y/perf/theme)
- 2. Design science (color, type, spacing, elevation)
- 3. Motion system (micro-interactions + demo intensity safely)
- 4. Component upgrade matrix (real files in this repo)
- 5. Site-wide features (search, nav, forms, content, SEO, PWA)
- 6. E-commerce platform demo (catalog → PDP → cart → checkout → account)
- 7. Data + API simulation (seeded realism)
- 8. Analytics + privacy-first instrumentation
- 9. Testing strategy (unit/e2e/a11y/visual)
- 10. Execution plan (PR slicing, acceptance criteria)
- 11. Deliverables checklist
- 12. Full codebase evolution map
- 13. Page-by-page upgrades (all routes)
- 14. Component-by-component upgrades (all components)
- 15. UI/Visuals deep dive (demo-lab + motion modules)
- 16. Scripts layer upgrades (client behavior)
- 17. Utilities/core/config/styles/store upgrades
- 18. Content system + blog maturity
- 19. Testing, quality, and CI hardening
- Appendix: research references + repo anchors

---

## 0) Role & quality bar

You are a **Principal Frontend Engineer + Product Engineer + Design Systems Lead**, shipping a production-grade static site with app-like UX:

- Think in **systems**: information architecture, content models, state management, theming, performance budgets, test strategy.
- Favor **incremental refactors** over “big bang” rewrites.
- Deliver changes as if this repo is a client deliverable with SOW acceptance criteria, not a hobby project.
- Treat the design system as a product:
  - tokens are APIs
  - components are contracts
  - accessibility and performance are features
- Every new feature must be:
  - **accessible** (keyboard, screen reader, focus management)
  - **mobile-first** (touch targets ≥ 48px, safe areas, iOS input zoom prevention)
  - **base-path safe** (GitHub Pages project site)
  - **performance-aware** (Core Web Vitals and JS budget)
  - **theme-compatible** (`ops-center`, `corporate`, `terminal`)
  - **testable** (Vitest + Playwright)

---

## 1) Ground truth constraints (non-negotiable)

### Hosting & routing

- **Deployment target:** GitHub Pages, static output only.
- **Base path is critical:** derived via `config/deployment.js` and used by `astro.config.mjs`.
- **Rule:** never hardcode internal links like `/about` without base-path handling.
  - Use the project’s canonical URL helpers (see repo docs / utilities).

### Static-first UX (must work with JS off)

- All core content (navigation, pricing, services, blog reading, legal pages, product browsing) must remain usable without JavaScript.
- JS enhances:
  - search suggestions
  - cart/wishlist
  - filtering
  - modals/drawers
  - analytics
  - demo-lab visuals

### Performance budget (mobile-first)

Target budgets based on the repo’s mobile-first directive:

- LCP $<2.5s$ (stretch $<2.0s$)
- CLS $<0.1$
- INP responsive and debounced (avoid long tasks)
- JS: keep initial interactive payload conservative; hydrate islands only when needed.

Rule of thumb: ship fewer, smarter islands; keep all “maximum intensity” work isolated to demo-lab routes.

### Architecture & state (keep the repo’s patterns)

- **Nanostores are the default for app-like state** that must span components/islands (cart, wishlist, compare, currency, preferences, feature flags).
  - Keep stores **typed**, small, and composable.
  - Persist only what you must (localStorage with versioned keys + safe parsing).
  - Avoid global Context for cross-cutting state unless there is a clear tree-scoped reason.

### Types are the interface

- Prefer discriminated unions for state machines (checkout steps, modal states).
- Prefer branded IDs (`ProductId`, `VariantId`) for correctness in large demos.
- Prefer branded IDs in demo data (`ProductId`, `VariantId`, `OrderId`) so refactors don’t silently break.
- Keep all persisted storage versioned, migratable, and resilient to parse failure.

### Demo-lab safety console integration (must be respected)

This repo already uses “demo-lab safety” flags via `document.documentElement.dataset` (examples include pause/reduced-motion/perf mode).

- All motion-heavy or interaction-dense features must:
  - read these flags
  - degrade gracefully
  - respect `prefers-reduced-motion`
  - provide pause affordances when applicable

### Legacy routes policy (do not accidentally resurrect archived pages)

The repo historically had multiple showcase/demo routes that were retired for SEO + safety reasons.

- Do **not** re-enable legacy routes unless the work also:
  - updates sitemap rules
  - updates robots rules
  - updates service worker caches
  - updates command palette navigation
  - verifies base-path correctness

Prefer adding curated, supported routes (e.g., `/demo-lab/`, `/shop/`, `/shop/[category]/`, `/product/[slug]/`) that are explicitly included everywhere.

### Global UX policies

Preserve and extend:

- Tailwind + CSS custom properties theming system
- existing color palette/tokens
- mobile-first patterns with safe-area support
- 48px touch target minimums
- reduced-motion support (`prefers-reduced-motion`) + demo-lab safety toggles
- existing animation vocabulary (subtle, polished)
- accessibility patterns (ARIA, focus, keyboard navigation)
- performance optimizations (lazy loading, `content-visibility`, `IntersectionObserver`)

### Global script discipline

- Avoid introducing heavy global scripts via the site head.
- Prefer per-page or per-component progressive enhancement.
- Keep “maximum intensity” effects isolated to demo-lab contexts.

---

## 2) Design science (10/10 professional design system)

This repo already has strong theming and a modern visual language (glass, gradients, glow, noise). The 2026 upgrade is about **calibrating** and **systematizing** it.

### 2.1 Color science: how to choose and evolve colors (research-backed)

Use a perceptual color model for predictable results:

- Prefer **OKLCH** (perceptual uniformity) for generating ramps and semantic states.
  - Keep hue stable, vary lightness/chroma intentionally.
  - Avoid “mystery saturation” where hover states become neon by accident.

Contrast rules:

- Minimum: WCAG 2.2 AA everywhere.
- Preferred: AAA for body text and dense UI.
- Use semantic colors for meaning (success/warn/danger/info) but do not rely on color alone.

Theme harmony:

- `ops-center` (dark): deeper neutrals, controlled chroma, avoid pure black for large areas.
- `corporate` (light): ensure low-chroma neutrals to prevent eye strain; preserve accent identity.
- `terminal` (green): maintain readability by limiting chroma on backgrounds; reserve green intensity for highlights.

State color mapping (consistent across site + shop):

- **Success**: in-stock, saved, applied promo, checkout confirmed
- **Warning**: low stock, delivery delays, validation warnings
- **Danger**: out of stock, payment failure (simulated), form errors
- **Info**: tooltips, helper text, “why we ask” explanations

Color ramp guidance (how pros avoid muddy UI):

- Build ramps with lightness steps that are _meaningful_, not arbitrary (e.g., 2–3 steps for borders, 3–4 for fills, 2 for text).
- Prefer subtle borders in dark UI: borders often need _higher_ lightness than expected to be visible.
- Use “surface” tokens rather than hardcoding colors (surface-1, surface-2, elevated, overlay).

### 2.2 Typography science

- Make the type scale explicit:
  - headings (display) vs UI text vs body
  - define a consistent ratio (e.g., 1.125–1.2 modular steps)
- Use **tabular figures** for prices to prevent layout jitter.
- Improve readability with line-height:
  - body longform: 1.65–1.75
  - UI labels: 1.2–1.35
- Refine tracking by size:
  - tighter tracking for large display headings
  - normal/looser tracking for small caps and monospace labels

### 2.3 Spacing + rhythm

- Introduce `section-sm / section-md / section-lg` spacing tokens.
- Normalize component internal spacing (padding + gaps) to a small set of values.
- Ensure touch target spacing respects thumb ergonomics.

### 2.4 Elevation and glassmorphism governance

- Define elevation levels (e.g., 0/1/2/3/overlay) with consistent shadow + border + blur.
- Avoid stacking multiple heavy blurs; use one blur layer + noise.
- Ensure overlays (modals/drawers) have consistent scrim + focus rings.

---

## 3) Motion system (micro-interactions + demo animations, safely)

This repo already has a motion vocabulary. Professionalize it into a “motion spec”:

### 3.1 Motion tokens

- Durations:
  - `fast: 150ms` (press/hover feedback)
  - `base: 250ms` (UI transitions)
  - `slow: 350ms` (large layout, modals)
- Easings:
  - entrance: `ease-out`
  - exit: `ease-in`
  - movement: `ease-in-out`
  - premium feel: cubic-bezier tuned for calm (no bouncy defaults in core pages)

### 3.2 Interaction rules

- Buttons: press feedback (scale 0.98), but never animate layout.
- Cards: subtle lift + shadow, keep hover effects off on touch.
- Drawers: slide-in with reduced-motion fallback.
- Toasts: slide + fade, `role="status"` for announcements.

### 3.3 Reduced motion compliance (3-layer)

All animations must respect:

1. OS `prefers-reduced-motion`
2. demo-lab toggle via dataset flags
3. functional fallbacks (no reliance on motion for understanding)

### 3.4 Demo-lab animation upgrades (specific to this repo)

The repo already has high-intensity demo components in `src/components/ui/`:

- `Advanced3DShowcase.astro`
- `ParticleVortex.astro`
- `InfinityTunnel.astro`
- `MatrixRain.astro`
- `ExplodingGrid.astro`, `FloatingIslands.astro`, `DNAHelix.astro`, `CSS3DScene.astro`, `PrismaticSphere.astro`, etc.

Upgrade rules (professional-grade):

- Add a shared “module pauser” pattern using `IntersectionObserver`:
  - when off-screen → pause animations (`animation-play-state: paused`, reduce filters)
  - when on-screen → resume
- Ensure all modules support:
  - perf mode: reduce particle counts, reduce blur/glow, reduce canvas work
  - paused mode: freeze loops
- Fix any non-standard CSS (no `random()` in CSS) by moving randomness to build-time inline styles or deterministic seeded logic.
- Touch correctness:
  - hover-only features must have tap/drag equivalents
  - do not block scroll with non-passive listeners unless required

---

## 4) Component upgrade matrix (real repo components)

Upgrade the whole site by systematically hardening the existing component library.

### 4.1 Global layout + head

- `src/components/BaseHead.astro`
  - tighten meta defaults
  - ensure view transitions don’t break focus management
  - ensure global scripts are minimal
- `src/layouts/*` (ensure consistent landmarks and skip links)

### 4.2 Navigation

- `src/components/Header.astro`, `HeaderLink.astro`
  - sticky + hide/show on scroll
  - accessible menu button + keyboard nav
  - add integrated search entry point
  - add shop entry points without breaking base paths

- `src/components/business/MobileNav.astro`
  - drill-down nav patterns
  - safe-area bottom padding
  - focus trap + escape close

### 4.3 Footer

- `src/components/Footer.astro`
  - add newsletter signup (simulated)
  - add customer service links + trust badges
  - add payment icon row + privacy links

### 4.4 UI primitives (polish pass)

- `src/components/ui/ModernButton.astro`
  - unify pressed/hover focus logic
  - ensure minimum touch targets consistently

- `src/components/ui/ModernCard.astro`, `Card.astro`, `AdvancedCard.astro`, `UltraCard.astro`
  - unify border radius and elevation tokens
  - ensure consistent spacing
  - reduce overuse of blur for perf mode

- `src/components/ui/Tooltip.astro`
  - ensure keyboard accessible triggers + escape close
  - prefer `aria-describedby` patterns

- `src/components/ToastContainer.tsx`
  - ensure live region behavior
  - add action affordances (undo, view cart)

### 4.5 Search + command palette

- `src/components/CommandPalette.tsx`, `src/components/command-search.worker.ts`, `src/pages/search-index.json.ts`
  - ensure index includes only supported routes
  - add ranking boosts (recent/frequent)
  - add query highlighting and no-results suggestions

### 4.6 Forms

- `src/components/ContactForm.astro` and any interactive forms:
  - zod schema + clear error messaging
  - `aria-live` announcements for errors/success
  - iOS zoom prevention (font-size 16px)

---

## 5) Site-wide feature expansion (surprise-level polish)

Beyond e-commerce, upgrade the entire site product experience:

### 5.1 Global preferences center

- Add a “Preferences” panel (lightweight) that controls:
  - theme
  - reduced motion toggle (simulate)
  - contrast mode (high contrast)
  - font size scaling (optional)

Persist with versioned keys and safe parsing.

### 5.2 Docs/Guides system (editorial engine)

- Add a “Guides” section (style guide, care tips, sizing, brand story).
- Add “Related content” build-time linking.
- Add table-of-contents using existing `src/components/TableOfContents.astro`.

### 5.3 Help center UX patterns

- Use `src/components/ui/FAQ.astro` and expand it into a searchable help center.
- Add “Was this helpful?” feedback.

### 5.4 PWA and offline

- Verify `public/sw.js` route caches match real routes.
- Add offline-safe fallbacks for shop browsing (cached product data with TTL).
- Add “Add to home screen” prompt only when it improves UX.

---

## 6) E-commerce demo platform (turn the demo into a mini platform)

### Quality gates

Treat these as “ship blockers”:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

(Repo goal: keep `npm run pre-deploy` green at all times.)

---

## Legacy block (retained notes from earlier draft; superseded by sections 5, 12, 13, 14+)

The section below is kept so no information is lost, but it is **not authoritative** if it conflicts with the organized sections above.

### 2.1 Information architecture (IA) & navigation

Make the whole site feel like a cohesive product:

- **Header**
  - Sticky header with hide-on-scroll-down / show-on-scroll-up.
  - Search icon → expanding search bar (mobile-first).
  - Cart / wishlist / account icons (demo mode where needed).
  - Clear focus states and keyboard navigation.

- **Mobile navigation**
  - Thumb-zone optimized.
  - Optional bottom navigation bar for key destinations (Home, Categories, Search, Cart, Account) — but do not increase global JS weight unnecessarily.
  - Provide drill-down for category trees.

- **Footer**
  - Expand to a “production-ready” footer:
    - newsletter signup (simulated)
    - social links placeholders
    - customer service links
    - legal links
    - payment icons (placeholders)
    - trust badges

- **Breadcrumbs**
  - Add breadcrumb navigation for deep pages.
  - Add JSON-LD `BreadcrumbList` structured data.

- **Command palette + site search truthfulness**
  - Ensure commands only target supported routes.
  - Ensure the search index includes only supported pages.
  - Highlight base-path safe navigation.

### 2.2 Content system maturity

Upgrade the content experience beyond “static pages”:

- Enforce strict content schemas (`src/content/config.ts`, `src/content.config.ts` etc.).
- Implement a build-time related-content engine (tags/categories).
- Add editorial storytelling blocks:
  - Style Guide section
  - How-to articles
  - care tips
  - behind-the-scenes brand story (placeholder)

**Important:** keep content readable with JS disabled.

### 2.3 Forms (static-first, real UX)

The repo currently uses static mailto for contact. Evolve without requiring a server runtime:

- Create a provider-agnostic “Form Handler” client layer:
  - supports Mailto (fallback), Formspree/Web3Forms (optional), or a simulated success state.
  - Zod validation on client.
  - Accessible error messages + live region announcements.
  - Optimistic UI.

### 2.4 Global accessibility upgrade (targeting AAA where feasible)

- Ensure focus indicators ≥ 3px outline.
- Ensure skip links exist for all major regions.
- Ensure modals:
  - trap focus
  - close on Escape
  - restore focus
  - have correct `role="dialog"` and `aria-modal="true"`
- Improve live regions for:
  - cart updates
  - filter results count
  - toast notifications

### 2.5 Global performance & technical excellence

- Enforce explicit image dimensions everywhere to reduce CLS.
- Adopt responsive image strategy:
  - WebP + fallback
  - optionally AVIF
  - `srcset` and `sizes`
  - blur-up or dominant-color skeleton placeholders
- Prefer route-level and component-level lazy hydration:
  - `client:visible`, `client:idle`, `client:media`
- Service worker:
  - pre-cache only **real supported routes**
  - keep offline page accurate

### 2.6 Design system refinements (keep existing language)

Refine without changing identity:

- typography micro-adjustments (tracking, line-height, tabular figures for prices)
- spacing rhythm tokens (`section-sm/md/lg`)
- consistent radius scale (4/8/12/16)
- consistent elevation system (cards, modals, dropdowns)
- improved semantic color use:
  - success for in-stock/confirmation
  - warning for low-stock/caution
  - danger for errors/out-of-stock
  - info for tooltips

---

## 6.1 Real constraints and architecture

E-commerce must integrate with the site, but stay demo-safe:

- No real payments
- No real auth (simulated)
- No server runtime

Primary requirement: users can demo the full journey:

$$\text{Browse} \rightarrow \text{PDP} \rightarrow \text{Cart} \rightarrow \text{Checkout} \rightarrow \text{Confirmation}$$

### 6.2 Upgrade the current implementation responsibly

Current demo lives in `src/components/demo-lab/EcommerceShowcase.tsx`. Upgrade path:

- Split the 2K+ component into a feature folder with:
  - UI primitives reused across pages
  - nanostore state for cart/wishlist/compare
  - route-ready components (PDP, category page)

### 6.3 Additional “surprise” features that fit static hosting

- **Saved carts**: generate a shareable encoded URL for a cart (demo) and allow restoring.
- **Price drop alerts** (simulated): if a wishlist item is on sale, surface a banner.
- **Smart empty states**: recommendations and “try these filters” UX.
- **Accessibility shortcuts**: keyboard shortcut help modal (`?`).
- **Performance mode auto-detect**: reduce intensity when `save-data` is enabled.

### 3.1 Current e‑commerce reality in this repo

- Main demo component: `src/components/demo-lab/EcommerceShowcase.tsx` (~2K lines).
- Demo data: `src/data/demo-ecommerce.ts`.
- Current features include: search, tag filtering, price range slider, cart, checkout steps, promo codes, wishlist, compare, recent views.
- Current architecture: Preact hooks + Tailwind styling + localStorage persistence.

**Upgrade rule:** the e‑commerce system must graduate from “isolated component” to a **site-integrated demo experience** while remaining safe for static hosting.

### 3.2 Strategic direction

Build a complete demo e‑commerce experience that feels production-grade:

- Add **Shop** entry points in site navigation.
- Add category pages, product pages (PDP), cart, checkout, account (demo), help center.
- Keep the demo safe: no real payments, no real user accounts.

### 3.3 Phase 1 (High impact, low complexity) — required

#### (A) Product catalog expansion

- Expand to **60–100 SKUs** across diversified categories.
- Add hierarchical categories (primary → subcategory).
- Add richer attributes for faceted filtering:
  - materials
  - style
  - sustainability flags
  - occasion
  - seasonal relevance
  - availability status
  - demographic targeting
- Add variant-level modeling:
  - per-variant pricing
  - per-variant inventory
  - per-variant images
  - variant SKUs
  - unavailable variant UI states

#### (B) Faceted filtering with live counts

- Implement multi-dimensional filters:
  - category tree
  - brand multi-select
  - color swatches
  - size
  - material
  - price buckets
  - rating
  - availability (in-stock only, on-sale, new arrivals)
  - sustainability

- Add active filter pills:
  - per-filter clear
  - clear-all
  - mobile horizontal scroll chips

#### (C) Search experience upgrade

- Search suggestions dropdown
- recent searches (persisted)
- popular searches
- query highlighting
- no-results alternative suggestions
- typo correction suggestions
- “search within results”

#### (D) View options + pagination strategies

- grid sizes (2/3/4)
- list view
- save preference in localStorage
- pagination modes:
  - numbered
  - load more
  - infinite scroll (optional, perf-aware)
- results per page selector
- jump-to-page

#### (E) Product detail experience (PDP)

- advanced image UX:
  - zoom on desktop
  - pinch-to-zoom on mobile
  - thumbnails
  - fullscreen gallery
  - video support (placeholder)
  - skeleton loading

- product content architecture:
  - tabs (Description/Specs/Reviews/Shipping)
  - accordions for mobile
  - size guide modal
  - materials & sustainability section

- reviews system:
  - rating histogram
  - sorting/filtering
  - verified purchase badges
  - helpful votes
  - review photos placeholders
  - write-a-review modal

- recommendations:
  - you may also like
  - recently viewed (site-wide)
  - frequently bought together (bundle builder)

#### (F) Cart intelligence

- free shipping progress bar
- save for later
- move to wishlist
- remove with undo
- quantity steppers with inventory enforcement
- itemized pricing breakdown
- ZIP-based tax estimation (simulated)
- promo code validation with specific errors

#### (G) Promotions + badges

- sale badge (% off)
- compare-at pricing
- deal of the day
- countdown timers (respect reduced motion)
- promo banner with dismiss
- promo auto-apply from URL parameters

#### (H) Footer expansion (site-wide)

- newsletter signup
- customer service links
- trust badges

### 3.4 Phase 2 (medium complexity) — recommended

- Account flows (simulated): signup/login/forgot password, dashboard, orders, addresses.
- Help center / FAQ with search.
- Live chat widget (simulated) + quick actions.
- Returns and exchanges flow (simulated).
- Email templates (simulated) for order/shipping/returns.
- Back-in-stock alerts.
- Gift card product type + redemption.
- Mega menu navigation.

### 3.5 Phase 3+ (high complexity) — optional but architect for it

- Recommendation engine sophistication.
- A/B testing framework (feature flag system).
- Analytics event tracking (vendor-agnostic layer).
- Personalization features.
- Subscriptions.
- Product customization.
- PWA enhancements (offline browsing, add-to-home-screen prompts, push opt-ins).
- i18n + multi-currency + RTL support.

---

## 7) Data + API simulation (seeded realism)

Professional demos feel real because data behaves realistically.

### 7.1 Seeded data generation

- Add a script to generate 60–100 products with:
  - coherent category trees
  - realistic variants
  - realistic pricing distributions
  - inventory realism (few low stock, some OOS)
  - review distributions skewed to 4–5 stars with meaningful negatives

Use deterministic seeding so builds are stable.

### 7.2 Fake API layer

Implement a client-side API module with:

- latency simulation
- rare error simulation
- caching + TTL
- stale-while-revalidate

This enables skeleton screens and resilient UX.

---

## 8) Analytics + privacy-first instrumentation

Design analytics as a thin, vendor-agnostic layer:

- Queue events when offline
- Respect consent
- Avoid collecting personal data

Add funnel reporting for the shop demo:

$$\text{PDP Views} \rightarrow \text{Add to Cart} \rightarrow \text{Checkout Start} \rightarrow \text{Purchase Confirm}$$

---

## 9) SEO + structured data

- Use `src/components/StructuredData.astro` for JSON-LD.
- Add Product + Review schema on PDP.
- Ensure canonical URLs are base-path safe.
- Add OG image generation at build time (recommended).

---

## 10) Testing strategy (raise confidence, prevent regressions)

### 4.1 Refactor strategy for `EcommerceShowcase.tsx`

The file is already impressive, but too large for long-term evolution.

- Split into focused modules:
  - `ProductGrid`, `FilterSidebar`, `FilterChipsBar`, `ProductCard`
  - `CartDrawer`, `CheckoutStepper`, `PromoCodeBox`
  - `QuickViewModal` / `PDPGallery`
  - `CompareModal`
  - `ReviewsPanel` / `ReviewFormModal`

- Extract reusable hooks:
  - `useLocalStorageState`
  - `useDebounce`
  - `useFocusTrap`
  - `useBodyScrollLock`
  - `useIntersectionPause`

### 4.2 Data layer simulation (static-safe)

Implement a fake API module that supports:

- deterministic delays
- error simulation (rare)
- caching + TTL
- stale-while-revalidate pattern

This unlocks skeleton loading, retry UX, and realistic flows without a backend.

### 4.3 Feature flag strategy

- Use a simple, typed feature-flag system.
- Allow toggling via:
  - query params
  - localStorage
  - build-time env flags

Keep sensitive features clearly marked as demo/simulated.

---

## 5) Analytics & tracking (privacy-first)

The repo already has `PUBLIC_ENABLE_ANALYTICS` mentioned in `README.md`.

Implement a vendor-agnostic analytics layer that can be enabled/disabled:

Events to track (demo):

- page views
- product views
- add/remove cart
- checkout step started/completed
- purchase completed (simulated)
- search queries + results count
- filters applied
- wishlist adds
- compare usage
- newsletter signups

Privacy-first requirements:

- cookie consent banner (if tracking enabled)
- opt-out
- do not track when disabled
- anonymous by default

---

## 6) SEO & discoverability (static-friendly)

Add/upgrade:

- Product JSON-LD schema on PDP (price, availability, ratings)
- Organization schema
- Review schema
- FAQ schema for help center
- dynamic Open Graph images (build-time generation recommended)
- sitemap generation that includes new supported pages only

All URLs must remain base-path safe.

---

Extend tests to match real project scale:

### Unit tests (Vitest)

- utilities: filtering, sorting, money formatting, promo validation, pagination
- state transitions: checkout step logic

### E2E tests (Playwright)

Critical paths:

- browse → filter → product → add to cart → checkout → confirm
- promo code validation
- accessibility checks (axe already present in repo)
- mobile viewport smoke tests

### Visual regression (recommended for 2026 maturity)

- homepage hero
- product cards
- cart drawer
- checkout steps
- footer

---

## 8) Performance targets (practical + measurable)

Target:

- Lighthouse ≥ 90 across Performance/Accessibility/Best Practices/SEO
- CLS ≤ 0.1
- LCP ≤ 2.5s
- INP optimized (debounced expensive operations)
- No console errors or warnings

Approach:

- aggressive lazy hydration
- defer non-critical scripts
- image optimization
- minimize re-renders in Preact components
- avoid expensive filters/blur in perf mode

---

## 11) Execution plan (how to ship like pros)

### Principles

- Ship in small PRs.
- Each PR must keep quality gates green.
- Keep a running changelog in `IMPROVEMENTS-LOG.md`.

### Recommended order of work (high-level)

1. **Site-wide foundations**: navigation truthfulness, footer, content system tightening, SW correctness.
2. **E‑commerce Phase 1**: data expansion → faceted filters → PDP upgrades → cart intelligence.
3. **Polish + quality**: a11y AAA pass, motion safety, typography micro-adjustments.
4. **Ops maturity**: Lighthouse CI, link checker, visual regression.

### Acceptance criteria per PR

- “Before/After” screenshot pairs for key views
- Lighthouse snapshot (local) for one critical route
- `npm run pre-deploy` must remain green
- A11y check: no new axe violations

---

## 10) “Genius engineer” checks (don’t skip)

- If you touch navigation, verify base-path correctness in preview and GH Pages base path.
- If you add overlays/modals, verify:
  - focus trap
  - escape closes
  - restore focus
  - scroll lock doesn’t cause layout shift
- If you add animations, verify:
  - reduced motion works
  - no seizure-risk flashing
  - perf mode reduces intensity
- If you add filtering/search, verify:
  - large catalog performance
  - counts correct
  - no-results UX is helpful

---

## 11) Deliverables checklist (definition of done)

- [ ] Whole site feels more cohesive (header/footer/nav/search)
- [ ] E‑commerce demo scales to 60–100 products with rich attributes
- [ ] Faceted filtering + active pills implemented
- [ ] Pagination modes implemented
- [ ] PDP experience upgraded (gallery, tabs, reviews)
- [ ] Cart intelligence implemented (free shipping bar, save for later, undo)
- [ ] Promotions/badges upgraded
- [ ] Accessibility audits pass (no axe violations)
- [ ] Performance targets met and no console warnings
- [ ] Tests expanded and passing

---

## 12) Full codebase evolution map (component-by-component, page-by-page)

This section is intentionally exhaustive. It is designed to be executed over many PRs, and it covers **every important area of the repo**, not only the shop demo.

### 12.1 How to use this section

- Treat each file checklist as a “Definition of Done” for that file.
- When a checklist says “create tests”, wire them into existing Vitest/Playwright patterns.
- Prefer improving and reusing existing primitives (`Card`, `ModernCard`, `ModernButton`, `Tooltip`, `ToastContainer`, `LazyImage`) over creating new ones.

### 12.2 Non-negotiable cross-cutting rules (apply to every file you touch)

- Base-path safe routing (GitHub Pages).
- Semantic HTML first, then ARIA.
- Keyboard-first interaction support.
- Touch targets ≥ 48px and safe-area spacing.
- `prefers-reduced-motion` respected everywhere; demo-lab dataset flags respected where applicable.
- No heavy global scripts; prefer progressive enhancement per-route/per-component.
- Avoid hydration “just because” — islands should be purposeful and minimal.

### 12.3 Global UI contract (applies to all components)

#### Focus and overlays

- All overlays (modal/drawer/popover) must:
  - trap focus
  - close on Escape
  - restore focus to invoker
  - avoid scroll-jank and layout shift
  - provide a click-outside dismiss only when it is not harmful

#### Motion and intensity

- All non-trivial motion must have:
  - reduced motion fallback
  - perf-mode fallback (lower cost)
  - pause affordance where the motion is continuous

#### Loading states

- Every network-like flow (fake API included) must have:
  - skeleton/loading placeholder
  - error state with recovery (retry)
  - empty state with guidance

### 12.4 Site-wide “productization” targets

- The site should feel like one coherent product:
  - consistent header behavior across pages
  - consistent footer across pages
  - consistent CTA patterns across pages
  - consistent cards, badges, pricing display, and typography

- The “demo-lab” should feel like a curated gallery, not a dump of experiments:
  - clear safety controls
  - clear labels (GPU-heavy, CPU-heavy, etc.)
  - pause/reduced motion/perf toggles actually affect every demo module

---

## 13) Route map and page-by-page upgrade checklist (every page)

Upgrade every route as if this were a production marketing + blog + demo product.

### 13.1 Global page checklist (apply to every `src/pages/*.astro`)

- [ ] Correct landmarks: `header`, `main`, `footer` and/or ARIA landmarks.
- [ ] Skip link present and visible-on-focus.
- [ ] Page title unique and descriptive.
- [ ] Meta description present and not duplicated.
- [ ] Canonical URL base-path safe.
- [ ] OG/Twitter tags correct.
- [ ] Structured data when appropriate.
- [ ] No layout shift from images (explicit dimensions).
- [ ] No blocking JS; islands only where needed.
- [ ] Reduced motion honored.
- [ ] Keyboard navigation verified.
- [ ] Mobile safe-area verified (iOS notch / home indicator).

### 13.2 Pages inventory (real repo files)

Each page below must be reviewed and upgraded using the global checklist above, plus its page-specific checklist.

#### `src/pages/index.astro` (Homepage)

- [ ] Hero message clarity (1 sentence value prop + 1 sentence proof).
- [ ] Primary CTA visible above the fold.
- [ ] Secondary CTA supports exploration (demo-lab, services, case studies).
- [ ] Include “system highlights” and “proof” sections using existing components.
- [ ] Performance: hero visuals degrade in perf mode.

#### `src/pages/about.astro`

- [ ] Tight narrative: mission, differentiators, operating principles.
- [ ] Use structured content blocks (avoid wall-of-text).
- [ ] Add credibility: testimonials/case studies cross-links.

#### `src/pages/services.astro`

- [ ] Service cards have consistent hierarchy (title, outcomes, bullets, CTA).
- [ ] Add service comparison table (static-first).
- [ ] Add “intake quiz” integration (simulated) with accessible form patterns.

#### `src/pages/pricing.astro`

- [ ] Pricing tiers consistent and comparable (same features order).
- [ ] Add “what’s included” expandable details.
- [ ] Integrate calculators (`PricingCalculator`, `ROICalculator`) without harming perf.

#### `src/pages/contact.astro`

- [ ] Form is static-first; enhance with client validation and good a11y.
- [ ] Clear response expectation: timeline, what happens next.

#### `src/pages/blog/[...page].astro` (Blog listing)

- [ ] Stable pagination links and canonicalization.
- [ ] Add “topics/tags” discoverability.
- [ ] Add reading-time, author, and date consistency.

#### `src/pages/blog/[slug].astro` (Blog post)

- [ ] Table of contents integration (`TableOfContents.astro`).
- [ ] Add “related posts” section using build-time linking.
- [ ] Code blocks (if any) styled accessibly with good contrast.

#### `src/pages/blog/tag/[tag].astro` (Tag page)

- [ ] Tag SEO: title/description reflects tag.
- [ ] Provide “all tags” navigation.

#### `src/pages/demo-lab.astro`

- [ ] Safety controls visible.
- [ ] Each demo labeled by cost (GPU/CPU).
- [ ] Pause/reduced motion/perf toggles wired into all demos.

#### `src/pages/visual-showcase.astro`, `src/pages/ultimate-3d-gallery.astro`, `src/pages/showcase.astro`, `src/pages/demo.astro`

- [ ] Audit relevance: keep only what supports the curated product.
- [ ] If retained, unify layout and safety controls.

#### `src/pages/shop-demo.astro` (Shop entry)

- [ ] Integrate with header/nav and base-path safe links.
- [ ] Add clear disclaimer: demo-only, no real payments.

#### `src/pages/dashboard.astro`, `src/pages/dashboard-v2.astro`, `src/pages/error-dashboard.astro`

- [ ] Clarify audience: internal ops vs public.
- [ ] Ensure any sensitive debug UI is demo-safe and does not leak data.

#### `src/pages/offline.astro`

- [ ] Offline UX: explain limitations and give next actions.
- [ ] Ensure SW truly routes to this on offline failures.

#### `src/pages/404.astro`

- [ ] Helpful recovery: search, popular links, contact.
- [ ] Track 404 occurrences (privacy-first) if analytics enabled.

#### `src/pages/privacy.astro`, `src/pages/terms.astro`

- [ ] Ensure legal pages are readable and accessible.
- [ ] Ensure last-updated dates and versioning are present.

#### `src/pages/robots.txt.ts`, `src/pages/rss.xml.js`, `src/pages/manifest.webmanifest.ts`, `src/pages/.well-known/security.txt.ts`

- [ ] Validate outputs are correct for base-path and deployment environment.
- [ ] Validate RSS and robots do not include retired routes.
- [ ] Ensure `security.txt` is current and contains correct contact.

---

## 14) Component-by-component upgrade checklist (every component)

This is a file-by-file hardening plan using the real repo inventory. Execute it in small PRs.

### 14.1 `src/components/*` (top-level components)

- `src/components/BaseHead.astro`
  - [ ] Standardize meta defaults (title templates, descriptions).
  - [ ] Add safe, minimal preconnects (only when needed).
  - [ ] Ensure theme-color meta updates by theme.
  - [ ] Ensure no heavy global JS slips in.

- `src/components/Header.astro`
  - [ ] Sticky + show/hide on scroll without jank.
  - [ ] Keyboard navigation and focus-visible states.
  - [ ] Search entry point is consistent across pages.
  - [ ] Add shop entry without breaking base-path.

- `src/components/HeaderLink.astro`
  - [ ] Active state rules are consistent and accessible.
  - [ ] External link styling and `rel` correctness.

- `src/components/Footer.astro`
  - [ ] Add “production-ready” footer structure (support, legal, socials, newsletter demo).
  - [ ] Ensure link groups are accessible and keyboard-friendly.
  - [ ] Add trust badges using `src/components/business/TrustBadge.astro`.

- `src/components/StructuredData.astro`
  - [ ] Make schemas composable per-page (Org, BreadcrumbList, Product, BlogPosting).
  - [ ] Ensure base-path safe URLs.

- `src/components/Analytics.astro`
  - [ ] Respect `PUBLIC_ENABLE_ANALYTICS`.
  - [ ] Never collect PII.
  - [ ] Add opt-out and consent gating if required.

- `src/components/WebVitals.astro`
  - [ ] Report vitals only when analytics enabled.
  - [ ] Sample rates (avoid noisy metrics).

- `src/components/PerformanceMonitor.astro`
  - [ ] Demo-safe: no sensitive info.
  - [ ] Visible only in demo-lab or debug routes.

- `src/components/ErrorTracking.astro`, `src/components/ErrorDashboard.astro`
  - [ ] Ensure errors are redacted.
  - [ ] Ensure UI is accessible and keyboard navigable.

- `src/components/ToastContainer.tsx`
  - [ ] `role="status"` live region correctness.
  - [ ] Add action toasts (undo, view cart).
  - [ ] Ensure toasts respect reduced motion.

- `src/components/TableOfContents.astro`
  - [ ] Works with headings and anchor offsets.
  - [ ] Keyboard-friendly and scroll-spy is optional.

- `src/components/ThemeProvider.astro`, `src/components/ThemeSelector.astro`
  - [ ] Theme persistence versioned.
  - [ ] Respect system theme.
  - [ ] Ensure contrast is validated per theme.

- `src/components/PWARegistration.astro`
  - [ ] Register SW responsibly (do not break navigation).
  - [ ] Provide update UI for new SW versions.

- `src/components/LegacyRedirect.astro`
  - [ ] Ensure redirects are base-path safe.
  - [ ] Avoid resurrecting retired routes.

- `src/components/ClientPortal.astro`, `src/components/FrameworkShowcase.astro`, `src/components/CodeShowcase.astro`, `src/components/AstroShowcase.astro`, `src/components/SystemHighlights.astro`, `src/components/FormattedDate.astro`
  - [ ] Unify typography and spacing.
  - [ ] Ensure images have dimensions and alt text.
  - [ ] Ensure any interactive elements have keyboard support.

### 14.2 `src/components/ui/*` (design system primitives + visual modules)

For every UI component, also enforce:

- [ ] It can render with JS disabled (or degrades gracefully).
- [ ] It respects theming tokens; no hardcoded colors unless justified.
- [ ] It is safe in perf mode and in reduced motion.

#### Core primitives

- `src/components/ui/Icon.astro`
  - [ ] Ensure icons have accessible names when used alone.
  - [ ] Ensure size defaults align with touch targets.

- `src/components/ui/Badge.astro`
  - [ ] Ensure semantic variants (success/warn/danger/info).
  - [ ] Ensure contrast in all themes.

- `src/components/ui/Card.astro`, `src/components/ui/ModernCard.astro`, `src/components/ui/AdvancedCard.astro`, `src/components/ui/UltraCard.astro`
  - [ ] Consolidate elevation/radius tokens so the set feels consistent.
  - [ ] Ensure hover styles do not trigger on touch.
  - [ ] Avoid expensive blur/filter in perf mode.

- `src/components/ui/ModernButton.astro`
  - [ ] Default variants: primary/secondary/ghost/danger.
  - [ ] Focus-visible ring consistent across themes.
  - [ ] Disabled state is visually and semantically correct.

- `src/components/ui/Tooltip.astro`
  - [ ] Keyboard support: open on focus, close on Escape.
  - [ ] Positioning stable; no layout shift.
  - [ ] Avoid hover-only meaning.

- `src/components/ui/LoadingSpinner.astro`
  - [ ] Reduced motion fallback (static indicator).
  - [ ] Avoid constant repaint hotspots.

#### Layout + composition

- `src/components/ui/Grid.astro`, `src/components/ui/ModernGrid.astro`, `src/components/ui/UltraGrid.astro`
  - [ ] Responsive grids are mobile-first.
  - [ ] Ensure container queries (if used) have fallbacks.

- `src/components/ui/ProgressBar.astro`
  - [ ] Respect reduced motion.
  - [ ] Provide text alternatives for screen readers.

- `src/components/ui/Stats.astro`, `src/components/ui/DashboardMetrics.astro`
  - [ ] Use tabular numerals.
  - [ ] Avoid number “jumping” layout.

#### Media and images

- `src/components/ui/LazyImage.astro`, `src/components/ui/ResponsiveImage.astro`
  - [ ] Require explicit dimensions.
  - [ ] Provide `srcset`/`sizes` guidelines.
  - [ ] Add blur-up or dominant-color placeholder.
  - [ ] Ensure alt text rules are documented.

#### Search/UI integrations

- `src/components/ui/Search.astro`
  - [ ] Static-first baseline search UX.
  - [ ] Progressive enhancement: suggestions and keyboard nav.
  - [ ] Ensure query highlighting is accessible.

#### Animation wrappers

- `src/components/ui/Animate.astro`, `src/components/ui/ModernAnimate.astro`, `src/components/ui/AdvancedAnimate.astro`, `src/components/ui/UltraAnimate.astro`
  - [ ] Ensure animation tokens are centralized.
  - [ ] Ensure reduced-motion removes transform/blur-heavy transitions.

- `src/components/ui/RevealOnScroll.astro`
  - [ ] IntersectionObserver is optional; content must appear without it.
  - [ ] No CLS when elements reveal.

#### Visual/demo modules (high intensity)

These must all implement:

- [ ] Pause support.
- [ ] Reduced motion support.
- [ ] Perf mode support (lower density / cheaper shading).
- [ ] Intersection pause offscreen.

- `src/components/ui/BackgroundEffects.astro`
  - [ ] Ensure effects can be globally disabled.
  - [ ] Ensure effects do not reduce text readability.

- `src/components/ui/Advanced3DShowcase.astro`
  - [ ] Provide a static fallback thumbnail.
  - [ ] Clamp GPU cost (limit draw calls).

- `src/components/ui/CSS3DScene.astro`
  - [ ] Avoid scroll-jank; prefer transform-only updates.
  - [ ] Provide a reduced-motion static scene.

- `src/components/ui/InfinityTunnel.astro`
  - [ ] Ensure animation can be paused.
  - [ ] Provide perf mode lower resolution.

- `src/components/ui/MatrixRain.astro`
  - [ ] Provide density control and pause.
  - [ ] Ensure contrast is still readable.

- `src/components/ui/ParticleVortex.astro`
  - [ ] Cap particle count and frame budget.
  - [ ] Avoid allocating every frame.

- `src/components/ui/ExplodingGrid.astro`, `src/components/ui/FloatingIslands.astro`, `src/components/ui/DNAHelix.astro`, `src/components/ui/PrismaticSphere.astro`, `src/components/ui/CubicMatrix.astro`, `src/components/ui/LayeredCards.astro`, `src/components/ui/HolographicCards.astro`, `src/components/ui/DemoBentoMorphGrid.astro`
  - [ ] Ensure mobile safety: no overheating loops.
  - [ ] Provide “calm mode” presets.

#### Misc UI blocks

- `src/components/ui/FAQ.astro`
  - [ ] Expand to searchable FAQ with accessible accordion patterns.
  - [ ] Add feedback (“Was this helpful?”) with privacy-safe logging.

- `src/components/ui/InteractiveForm.astro`
  - [ ] Ensure validation + ARIA error patterns.
  - [ ] Ensure it works on mobile (no iOS zoom).

- `src/components/ui/Navigation.astro`, `src/components/ui/ThemeToggle.astro`, `src/components/ui/FloatingDemoButton.astro`, `src/components/ui/PricingCard.astro`, `src/components/ui/CTA.astro`, `src/components/ui/Testimonials.astro`, `src/components/ui/TagCloud.astro`
  - [ ] Unify spacing, type scale, and focus styles.
  - [ ] Ensure all CTAs have clear labels.

### 14.3 `src/components/landing/*` (homepage sections)

- `src/components/landing/HeroSection.astro`
  - [ ] Tight narrative: value prop + proof + CTA.
  - [ ] Ensure hero animation is perf-aware.

- `src/components/landing/SignalGrid.astro`
  - [ ] Ensure signal visuals do not dominate content.
  - [ ] Provide reduced-motion static fallback.

- `src/components/landing/EngagementSection.astro`, `src/components/landing/InsightSection.astro`, `src/components/landing/PlaybookSection.astro`, `src/components/landing/TestimonialsSection.astro`, `src/components/landing/ControlStackSection.astro`, `src/components/landing/DemoCtaSection.astro`
  - [ ] Normalize heading scale and spacing.
  - [ ] Ensure each section has a single purpose.
  - [ ] Ensure CTAs do not compete.

### 14.4 `src/components/business/*` (trust + conversion components)

- `src/components/business/ServiceCard.astro`
  - [ ] Outcome-first bullet structure.
  - [ ] Consistent icon + spacing rules.

- `src/components/business/CaseStudyCard.astro`
  - [ ] Consistent metadata layout.
  - [ ] Ensure image performance and alt text.

- `src/components/business/TrustBadge.astro`
  - [ ] Contrast-safe badges.
  - [ ] Avoid meaningless decorative text for screen readers.

- `src/components/business/PricingTier.astro`, `src/components/business/TestimonialSlider.astro`
  - [ ] Keyboard and reduced-motion safe.
  - [ ] Ensure slider has non-auto-advancing default.

- `src/components/business/MobileNav.astro`
  - [ ] Drill-down nav with focus trap.
  - [ ] Safe-area bottom padding.

- `src/components/business/StickyCTA.astro`
  - [ ] Respect safe area.
  - [ ] Avoid blocking content.
  - [ ] Provide close/dismiss.

- `src/components/business/LiveChat.tsx`
  - [ ] Demo-safe: no real messaging.
  - [ ] Accessible chat widget patterns (focus, keyboard).
  - [ ] Reduce motion for opening transitions.

- `src/components/business/PricingCalculator.tsx`, `src/components/business/ROICalculator.tsx`, `src/components/business/ServicesQuiz.tsx`
  - [ ] Ensure input labels, error messages, and units.
  - [ ] iOS zoom prevention.
  - [ ] Results are readable by screen readers.
  - [ ] No heavy compute on main thread (debounce).

### 14.5 `src/components/demo-lab/*` (interactive demo apps)

- `src/components/demo-lab/EcommerceShowcase.tsx`
  - [ ] Refactor into feature folders without breaking UX.
  - [ ] Extract state to nanostores.
  - [ ] Add PDP route-ready components.
  - [ ] Ensure keyboard shortcuts are discoverable and customizable.
  - [ ] Ensure reduced motion is fully honored (including swipe/drag effects).

### 14.6 `src/components/solid/*` (Solid islands)

- `src/components/solid/ReactiveCounter.tsx`
  - [ ] Treat as reference for Solid integration.
  - [ ] Ensure hydration boundaries are intentional.

---

## 15) Visual excellence + demo-lab “museum quality” upgrades

This is where the repo can become unmistakably premium.

### 15.1 Demo-lab safety system: required behaviors

The demo-lab toggles must become a central contract.

- Define a shared helper (utility) for reading dataset flags:
  - pause
  - reduced motion
  - perf mode
  - optional “intensity” scalar (0–1)

### 15.2 Render loop governance (no runaway work)

- Cap animation loops to a target FPS in perf mode.
- Avoid per-frame allocations.
- Prefer CSS transforms over expensive filters.
- Pause offscreen.

### 15.3 Visual QA checklist

- [ ] Contrast verified on all themes.
- [ ] Text remains readable over background effects.
- [ ] Mobile heat test (no continuous 100% GPU).
- [ ] Reduced motion path is clean (no “half animations”).

---

## 16) `src/scripts/*` upgrades (client behavior layer)

This repo includes client scripts that shape UX across pages.

### 16.1 Universal script rules

- Scripts must be:
  - idempotent (safe to run twice)
  - resilient (no uncaught exceptions)
  - optional (UI remains functional without them)
  - passive listeners for scroll/touch where possible

### 16.2 File-by-file checklist

- `src/scripts/header.ts`
  - [ ] Sticky/show-hide behavior without jank.
  - [ ] Avoid scroll handlers when IntersectionObserver can be used.

- `src/scripts/animations.ts`
  - [ ] Centralize motion tokens.
  - [ ] Respect reduced motion.
  - [ ] Support perf mode.

- `src/scripts/demo-lab.ts`
  - [ ] Make dataset flags authoritative.
  - [ ] Persist user choice (versioned).
  - [ ] Provide a UI “control panel” that is accessible.

- `src/scripts/magnetic-buttons.ts`
  - [ ] Disable on touch devices by default.
  - [ ] Perf mode reduces strength / disables.

- `src/scripts/spotlight.ts`
  - [ ] Avoid repaint-heavy effects.
  - [ ] Respect reduced motion and perf mode.

- `src/scripts/contact-form.ts`
  - [ ] Zod validation + ARIA error patterns.
  - [ ] Provide provider-agnostic submission.

- `src/scripts/error-dashboard.ts`
  - [ ] Demo-safe and no sensitive logs.
  - [ ] Accessible tables and filters.

---

## 17) Utilities, core, config, styles, and stores (full codebase hardening)

### 17.1 `src/styles/*`

- `src/styles/global.css`
  - [ ] Ensure focus-visible is consistent and high contrast.
  - [ ] Ensure reduced-motion rules exist globally.
  - [ ] Ensure safe-area utilities exist.

- `src/styles/theme.ts`
  - [ ] Centralize theme tokens.
  - [ ] Add OKLCH ramps and semantic tokens.
  - [ ] Provide token docs in comments.

### 17.2 `src/store/*`

- `src/store/index.ts`
  - [ ] Export typed stores consistently.
  - [ ] Avoid circular deps.

- `src/store/theme.ts`
  - [ ] Versioned persistence.
  - [ ] System theme integration.

### 17.3 `src/config/*`

- `src/config/security.ts`
  - [ ] Ensure CSP guidance is accurate for static hosting.
  - [ ] Sanitize any HTML injection risk.

- `src/config/performance.ts`, `src/config/performance-budgets.ts`
  - [ ] Document budgets and enforce them in CI (optional).

- `src/config/schema.ts`
  - [ ] Centralize Zod schemas for forms and content.

- `src/config/config-loader.ts`
  - [ ] Ensure environment variables have safe defaults.

### 17.4 `src/errors/index.ts`

- [ ] Ensure errors are typed and categorized.
- [ ] Provide redaction helpers.

### 17.5 `src/core/analyzer.ts`

- [ ] Ensure analyzer is deterministic.
- [ ] Provide clear boundaries and no network requirements.

### 17.6 `src/utils/*` (the repo’s “standard library”)

This folder is large. Treat it like a product: stable APIs, tests, and docs.

#### Universal checklist for every `src/utils/*.ts`

- [ ] Named exports, no default exports.
- [ ] Pure functions where possible.
- [ ] Typed inputs/outputs.
- [ ] Defensive against `null`/`undefined`.
- [ ] Includes tests (many already exist — expand coverage).

#### High-priority utilities (must be rock-solid)

- `src/utils/a11y.ts`
  - [ ] Focus management helpers.
  - [ ] ARIA-safe utilities.

- `src/utils/animation.ts`
  - [ ] Central motion tokens.
  - [ ] Reduced motion helpers.

- `src/utils/api.ts`
  - [ ] Fake API helpers with latency/error simulation.
  - [ ] Caching + TTL.

- `src/utils/analytics-tracker.ts`
  - [ ] Vendor-agnostic event API.
  - [ ] Queue + flush.
  - [ ] Respect analytics enable flag.

- `src/utils/seo.ts`
  - [ ] Canonical URL helpers base-path safe.
  - [ ] OG generation helpers.

- `src/utils/search.ts`
  - [ ] Search ranking and highlighting.
  - [ ] Perf considerations for large catalogs.

- `src/utils/storage.ts`
  - [ ] Versioned persistence with migrations.
  - [ ] Safe JSON parsing.

- `src/utils/theme.ts`
  - [ ] Theme resolution order: explicit → stored → system.
  - [ ] Ensure no flash of incorrect theme.

- `src/utils/validation.ts`, `src/utils/form.ts`
  - [ ] Standardized validation error shapes.
  - [ ] Accessibility-friendly error messaging.

### 17.7 Complete inventory checklist index (make this repo “fully covered”)

Use this as a master checklist to ensure nothing gets skipped. Each item is “done” only when:

- the file has been reviewed,
- obvious technical debt is addressed (within reason),
- behavior is documented (briefly),
- and tests exist where appropriate.

#### `src/scripts/*`

- [ ] `src/scripts/animations.ts`
- [ ] `src/scripts/contact-form.ts`
- [ ] `src/scripts/demo-lab.ts`
- [ ] `src/scripts/error-dashboard.ts`
- [ ] `src/scripts/header.ts`
- [ ] `src/scripts/magnetic-buttons.ts`
- [ ] `src/scripts/spotlight.ts`

#### `src/pages/*` (route inventory)

- [ ] `src/pages/index.astro`
- [ ] `src/pages/about.astro`
- [ ] `src/pages/services.astro`
- [ ] `src/pages/pricing.astro`
- [ ] `src/pages/contact.astro`
- [ ] `src/pages/privacy.astro`
- [ ] `src/pages/terms.astro`
- [ ] `src/pages/offline.astro`
- [ ] `src/pages/404.astro`
- [ ] `src/pages/components.astro`
- [ ] `src/pages/demo-lab.astro`
- [ ] `src/pages/shop-demo.astro`
- [ ] `src/pages/dashboard.astro`
- [ ] `src/pages/dashboard-v2.astro`
- [ ] `src/pages/error-dashboard.astro`
- [ ] `src/pages/demo.astro`
- [ ] `src/pages/showcase.astro`
- [ ] `src/pages/visual-showcase.astro`
- [ ] `src/pages/ultimate-3d-gallery.astro`
- [ ] `src/pages/utility-demo.astro`

- [ ] `src/pages/blog/[...page].astro`
- [ ] `src/pages/blog/[slug].astro`
- [ ] `src/pages/blog/tag/[tag].astro`

- [ ] `src/pages/manifest.webmanifest.ts`
- [ ] `src/pages/robots.txt.ts`
- [ ] `src/pages/rss.xml.js`
- [ ] `src/pages/search-index.json.ts`
- [ ] `src/pages/.well-known/security.txt.ts`

#### `src/layouts/*`

- [ ] `src/layouts/MarketingLayout.astro`
- [ ] `src/layouts/BlogPost.astro`

#### `src/components/*` (top-level)

- [ ] `src/components/Analytics.astro`
- [ ] `src/components/AstroShowcase.astro`
- [ ] `src/components/BaseHead.astro`
- [ ] `src/components/ClientPortal.astro`
- [ ] `src/components/CodeShowcase.astro`
- [ ] `src/components/CommandPalette.tsx`
- [ ] `src/components/command-search.worker.ts`
- [ ] `src/components/ContactForm.astro`
- [ ] `src/components/ErrorDashboard.astro`
- [ ] `src/components/ErrorTracking.astro`
- [ ] `src/components/Footer.astro`
- [ ] `src/components/FormattedDate.astro`
- [ ] `src/components/FrameworkShowcase.astro`
- [ ] `src/components/Header.astro`
- [ ] `src/components/HeaderLink.astro`
- [ ] `src/components/LegacyRedirect.astro`
- [ ] `src/components/PerformanceMonitor.astro`
- [ ] `src/components/PWARegistration.astro`
- [ ] `src/components/StructuredData.astro`
- [ ] `src/components/SystemHighlights.astro`
- [ ] `src/components/TableOfContents.astro`
- [ ] `src/components/ThemeProvider.astro`
- [ ] `src/components/ThemeSelector.astro`
- [ ] `src/components/ToastContainer.tsx`
- [ ] `src/components/WebVitals.astro`

#### `src/components/landing/*`

- [ ] `src/components/landing/HeroSection.astro`
- [ ] `src/components/landing/SignalGrid.astro`
- [ ] `src/components/landing/EngagementSection.astro`
- [ ] `src/components/landing/InsightSection.astro`
- [ ] `src/components/landing/PlaybookSection.astro`
- [ ] `src/components/landing/TestimonialsSection.astro`
- [ ] `src/components/landing/ControlStackSection.astro`
- [ ] `src/components/landing/DemoCtaSection.astro`

#### `src/components/business/*`

- [ ] `src/components/business/MobileNav.astro`
- [ ] `src/components/business/StickyCTA.astro`
- [ ] `src/components/business/ServiceCard.astro`
- [ ] `src/components/business/CaseStudyCard.astro`
- [ ] `src/components/business/TrustBadge.astro`
- [ ] `src/components/business/PricingTier.astro`
- [ ] `src/components/business/TestimonialSlider.astro`
- [ ] `src/components/business/LiveChat.tsx`
- [ ] `src/components/business/PricingCalculator.tsx`
- [ ] `src/components/business/ROICalculator.tsx`
- [ ] `src/components/business/ServicesQuiz.tsx`

#### `src/components/demo-lab/*`

- [ ] `src/components/demo-lab/EcommerceShowcase.tsx`

#### `src/components/solid/*`

- [ ] `src/components/solid/ReactiveCounter.tsx`

#### `src/components/ui/*`

- [ ] `src/components/ui/Advanced3DShowcase.astro`
- [ ] `src/components/ui/AdvancedAnimate.astro`
- [ ] `src/components/ui/AdvancedCard.astro`
- [ ] `src/components/ui/Animate.astro`
- [ ] `src/components/ui/BackgroundEffects.astro`
- [ ] `src/components/ui/Badge.astro`
- [ ] `src/components/ui/Card.astro`
- [ ] `src/components/ui/CSS3DScene.astro`
- [ ] `src/components/ui/CTA.astro`
- [ ] `src/components/ui/CubicMatrix.astro`
- [ ] `src/components/ui/DashboardMetrics.astro`
- [ ] `src/components/ui/DemoBentoMorphGrid.astro`
- [ ] `src/components/ui/DNAHelix.astro`
- [ ] `src/components/ui/ExplodingGrid.astro`
- [ ] `src/components/ui/FAQ.astro`
- [ ] `src/components/ui/FloatingDemoButton.astro`
- [ ] `src/components/ui/FloatingIslands.astro`
- [ ] `src/components/ui/Grid.astro`
- [ ] `src/components/ui/HolographicCards.astro`
- [ ] `src/components/ui/Icon.astro`
- [ ] `src/components/ui/InfinityTunnel.astro`
- [ ] `src/components/ui/InteractiveForm.astro`
- [ ] `src/components/ui/LayeredCards.astro`
- [ ] `src/components/ui/LazyImage.astro`
- [ ] `src/components/ui/LoadingSpinner.astro`
- [ ] `src/components/ui/MatrixRain.astro`
- [ ] `src/components/ui/ModernAnimate.astro`
- [ ] `src/components/ui/ModernButton.astro`
- [ ] `src/components/ui/ModernCard.astro`
- [ ] `src/components/ui/ModernGrid.astro`
- [ ] `src/components/ui/Navigation.astro`
- [ ] `src/components/ui/ParticleVortex.astro`
- [ ] `src/components/ui/PricingCard.astro`
- [ ] `src/components/ui/PrismaticSphere.astro`
- [ ] `src/components/ui/ProgressBar.astro`
- [ ] `src/components/ui/ResponsiveImage.astro`
- [ ] `src/components/ui/RevealOnScroll.astro`
- [ ] `src/components/ui/Search.astro`
- [ ] `src/components/ui/Stats.astro`
- [ ] `src/components/ui/TagCloud.astro`
- [ ] `src/components/ui/Testimonials.astro`
- [ ] `src/components/ui/ThemeToggle.astro`
- [ ] `src/components/ui/Tooltip.astro`
- [ ] `src/components/ui/UltraAnimate.astro`
- [ ] `src/components/ui/UltraCard.astro`
- [ ] `src/components/ui/UltraGrid.astro`

#### `src/utils/*` (full file inventory)

Implementation files:

- [ ] `src/utils/a11y.ts`
- [ ] `src/utils/analysis-cache.ts`
- [ ] `src/utils/analytics-tracker.ts`
- [ ] `src/utils/animation.ts`
- [ ] `src/utils/api.ts`
- [ ] `src/utils/array.ts`
- [ ] `src/utils/async.ts`
- [ ] `src/utils/av.ts`
- [ ] `src/utils/batch.ts`
- [ ] `src/utils/binary.ts`
- [ ] `src/utils/blog.ts`
- [ ] `src/utils/cache.ts`
- [ ] `src/utils/canvas.ts`
- [ ] `src/utils/clipboard.ts`
- [ ] `src/utils/collections.ts`
- [ ] `src/utils/color.ts`
- [ ] `src/utils/command-executor.ts`
- [ ] `src/utils/common.ts`
- [ ] `src/utils/compression.ts`
- [ ] `src/utils/crypto.ts`
- [ ] `src/utils/css.ts`
- [ ] `src/utils/csv.ts`
- [ ] `src/utils/date.ts`
- [ ] `src/utils/device.ts`
- [ ] `src/utils/diff.ts`
- [ ] `src/utils/dom.ts`
- [ ] `src/utils/drag-drop.ts`
- [ ] `src/utils/error-reviewer-cli.ts`
- [ ] `src/utils/events.ts`
- [ ] `src/utils/form.ts`
- [ ] `src/utils/format.ts`
- [ ] `src/utils/formatters.ts`
- [ ] `src/utils/function.ts`
- [ ] `src/utils/functional.ts`
- [ ] `src/utils/geolocation.ts`
- [ ] `src/utils/graph.ts`
- [ ] `src/utils/helpers.ts`
- [ ] `src/utils/history.ts`
- [ ] `src/utils/http.ts`
- [ ] `src/utils/i18n.ts`
- [ ] `src/utils/index.ts`
- [ ] `src/utils/intersection.ts`
- [ ] `src/utils/keyboard.ts`
- [ ] `src/utils/logger.ts`
- [ ] `src/utils/math.ts`
- [ ] `src/utils/media.ts`
- [ ] `src/utils/metrics.ts`
- [ ] `src/utils/network.ts`
- [ ] `src/utils/object.ts`
- [ ] `src/utils/performance-utils.ts`
- [ ] `src/utils/reading-time.ts`
- [ ] `src/utils/regex.ts`
- [ ] `src/utils/related-content.ts`
- [ ] `src/utils/report-generator.ts`
- [ ] `src/utils/resilience.ts`
- [ ] `src/utils/scheduler.ts`
- [ ] `src/utils/search.ts`
- [ ] `src/utils/seo.ts`
- [ ] `src/utils/share.ts`
- [ ] `src/utils/state-machine.ts`
- [ ] `src/utils/storage.ts`
- [ ] `src/utils/string.ts`
- [ ] `src/utils/theme.ts`
- [ ] `src/utils/url.ts`
- [ ] `src/utils/validation.ts`
- [ ] `src/utils/websocket.ts`

Test files:

- [ ] `src/utils/a11y.test.ts`
- [ ] `src/utils/animation.test.ts`
- [ ] `src/utils/api.test.ts`
- [ ] `src/utils/array.test.ts`
- [ ] `src/utils/async.test.ts`
- [ ] `src/utils/av.test.ts`
- [ ] `src/utils/binary.test.ts`
- [ ] `src/utils/cache.test.ts`
- [ ] `src/utils/canvas.test.ts`
- [ ] `src/utils/clipboard.test.ts`
- [ ] `src/utils/color.test.ts`
- [ ] `src/utils/crypto.test.ts`
- [ ] `src/utils/css.test.ts`
- [ ] `src/utils/csv.test.ts`
- [ ] `src/utils/date.test.ts`
- [ ] `src/utils/device.test.ts`
- [ ] `src/utils/dom.test.ts`
- [ ] `src/utils/drag-drop.test.ts`
- [ ] `src/utils/events.test.ts`
- [ ] `src/utils/form.test.ts`
- [ ] `src/utils/format.test.ts`
- [ ] `src/utils/formatters.test.ts`
- [ ] `src/utils/function.test.ts`
- [ ] `src/utils/functional.test.ts`
- [ ] `src/utils/geolocation.test.ts`
- [ ] `src/utils/graph.test.ts`
- [ ] `src/utils/history.test.ts`
- [ ] `src/utils/http.test.ts`
- [ ] `src/utils/intersection.test.ts`
- [ ] `src/utils/keyboard.test.ts`
- [ ] `src/utils/logger.test.ts`
- [ ] `src/utils/math.test.ts`
- [ ] `src/utils/metrics.test.ts`
- [ ] `src/utils/network.test.ts`
- [ ] `src/utils/object.test.ts`
- [ ] `src/utils/reading-time.test.ts`
- [ ] `src/utils/regex.test.ts`
- [ ] `src/utils/related-content.test.ts`
- [ ] `src/utils/scheduler.test.ts`
- [ ] `src/utils/search.test.ts`
- [ ] `src/utils/seo.test.ts`
- [ ] `src/utils/share.test.ts`
- [ ] `src/utils/state-machine.test.ts`
- [ ] `src/utils/storage.test.ts`
- [ ] `src/utils/string.test.ts`
- [ ] `src/utils/string-extended.test.ts`
- [ ] `src/utils/theme.test.ts`
- [ ] `src/utils/url.test.ts`
- [ ] `src/utils/validation.test.ts`
- [ ] `src/utils/websocket.test.ts`

---

## 18) Content system + blog maturity

### 18.1 `src/content/config.ts`

- [ ] Strict schemas for blog, case studies, testimonials, authors.
- [ ] Enforce required fields.
- [ ] Add build-time cross-linking utilities.

### 18.2 Content UX rules

- Blog posts must include:
  - table of contents
  - reading time
  - author card
  - related content
  - accessible typography and code styles

---

## 19) Testing, quality, and CI hardening (2026-level confidence)

### 19.1 Expand Playwright coverage (route-by-route)

- Home: nav, CTA, reduced motion.
- Services: quiz/calculators.
- Pricing: tier rendering and calculator interactions.
- Contact: validation states.
- Blog: listing/pagination, tag pages, post page.
- Demo-lab: toggles affect demos.
- Shop demo: browse → filter → PDP → cart → checkout.

### 19.2 Accessibility automation

- Run axe checks on key routes.
- Add keyboard-only navigation tests.

### 19.3 Performance budgets

- Add a lightweight “budget checker” (optional) that fails CI if:
  - bundle size regresses
  - Core Web Vitals regress beyond thresholds

### 19.4 Vitest depth (treat utils as a product)

Expand the unit-test strategy to match the actual utility surface area:

- Test invariants (never regress):
  - URL/base-path helpers
  - storage parse/migrations
  - SEO helpers
  - search highlighting
  - state machine transitions
  - validation error shapes

- Add property-like tests (lightweight, deterministic):
  - formatting functions
  - parsing functions
  - sort/filter functions

- Add regression tests for any bug discovered by the error dashboard.

### 19.5 E2E “golden paths” per product area

Marketing funnel:

- home → services → pricing → contact

Content funnel:

- blog list → tag → post → related post

Demo funnel:

- demo-lab → enable perf mode → verify modules reduce intensity

Shop funnel:

- shop demo → filter/search → open PDP/quick view → add to cart → checkout confirm

### 19.6 Quality gates as code

- Ensure `npm run pre-deploy` remains the single “green light”.
- Add a repo-level checklist in PR descriptions:
  - a11y check
  - mobile check
  - perf check
  - base-path check
  - reduced motion check

---

## 20) Security, privacy, and resilience (static-first, still serious)

Even a static site needs real security discipline.

### 20.1 Threat model (practical)

- XSS via content rendering (MD/MDX)
- unsafe URL handling (open redirects)
- unsafe client-side storage (poisoned localStorage)
- supply-chain risks (deps)
- privacy leaks (analytics)

### 20.2 Security requirements

- Never render unsanitized HTML from content without explicit sanitization.
- Treat all URL parameters as hostile:
  - validate
  - clamp
  - encode

- Storage hardening:
  - version keys
  - safe parse
  - migrations
  - ignore unknown fields

### 20.3 Content security policies (be realistic for Astro + GH Pages)

- Prefer a CSP that blocks inline scripts where possible.
- If inline scripts exist, document why and scope them.
- Avoid `unsafe-eval`.

### 20.4 Privacy-first analytics contract

- Default: analytics off unless enabled.
- No PII.
- Respect DNT (if implemented) and user opt-out.
- Provide a “data we collect” statement.

### 20.5 Service worker safety

If SW caching is used (`public/sw.js`):

- Don’t cache sensitive routes.
- Don’t cache POST responses.
- Provide safe offline fallbacks.
- Provide update UX:
  - “New version available” banner
  - “Refresh” action

---

## 21) Deployment and operations (GitHub Pages perfection)

### 21.1 Base-path correctness checklist

- Every internal link must be base-path safe.
- Canonical URLs must be base-path safe.
- Sitemap must list only supported routes.
- Robots must not accidentally expose retired routes.
- Search index must not include retired routes.

### 21.2 Release checklist (every release)

- [ ] `npm run pre-deploy` green
- [ ] No console errors
- [ ] Key routes pass Playwright
- [ ] Axe checks pass
- [ ] Offline page works
- [ ] Demo-lab safety toggles verified

### 21.3 Observability (demo-safe)

- Keep error tracking redacted.
- Prefer aggregations over raw logs.
- Provide an “export debug report” button only in demo contexts.

---

## Appendix C: Legacy notes (do not delete; reconcile over time)

If earlier drafts contain duplicate or overlapping requirements (e.g., older “site-wide improvement initiative” notes), keep them in the repo, but reconcile them into the authoritative sections (12–21) over time.

## Appendix A: Research references (non-exhaustive, practical)

These references guide the choices above:

- WCAG 2.2 (contrast, focus, input guidance)
- WAI-ARIA Authoring Practices (modals, menus, tabs)
- Core Web Vitals (LCP/CLS/INP)
- CSS Color 4 / OKLCH (perceptual ramps)
- Material Design 3 color/motion heuristics (not the aesthetic, the science)
- Nielsen Norman heuristics (UX clarity, error prevention)

## Appendix B: Quick repo anchors (real files)

- E‑commerce demo component: `src/components/demo-lab/EcommerceShowcase.tsx`
- E‑commerce data: `src/data/demo-ecommerce.ts`
- Deployment config: `config/deployment.js`
- Astro config: `astro.config.mjs`
- Mobile-first directive: `MOBILE-FIRST-EXCELLENCE-DIRECTIVE.md`
- Design upgrades summary: `DESIGN-IMPROVEMENTS.md`
- Code upgrades summary: `CODE-IMPROVEMENTS.md`
- Phase roadmap: `NEXT-PHASE-PROMPT.md`
