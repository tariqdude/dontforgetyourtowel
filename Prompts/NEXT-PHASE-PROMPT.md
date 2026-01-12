# Strategic Development Roadmap: Phase 2 (Static Ops Maturity)

**Role:** Senior Frontend Architect & Astro Specialist
**Project Context:** `github-pages-project-v1` (Astro + Tailwind + TypeScript)
**Deployment Target:** GitHub Pages (Strict Static Hosting)
**Core Philosophy:** "Static First, Dynamic Feel" — delivering app-like interactivity and operational intelligence without server-side runtime dependencies.

---

## Primary Objectives

### 1. The "Intelligent" Static Content Layer

_Goal: Elevate the content experience beyond simple Markdown rendering._

- **Implement Client-Side Search:** Integrate **Pagefind** (or Fuse.js) to provide instant, typo-tolerant full-text search across documentation, blog posts, and service offerings. This must run entirely in the browser using a pre-built search index.
- **Automated Open Graph (OG) Image Generation:** Implement `@astrojs/satori` or a similar solution to auto-generate social sharing images for every blog post and page at build time, using the post title, date, and tags.
- **Advanced Taxonomy & Relations:** Build a "Related Content" engine that runs at build-time to link blog posts, case studies, and documentation based on shared tags or frontmatter categories, creating a denser internal linking structure.

### 2. Component System Maturity (The "Modern" UI)

_Goal: Expand the `ModernCard` design language into a full-featured design system._

- **Data Visualization Components:** Create static-friendly charts (using libraries like Recharts or Visx, adapted for static rendering where possible, or lightweight client-side hydration) to visualize "System Status" or "Performance Metrics" in the dashboard pages.
- **Interactive Data Tables:** Build a sortable, filterable table component for the "Pricing" or "Feature Comparison" sections that uses client-side logic (React/Preact islands) to handle large datasets without page reloads.
- **Form Handling Patterns:** Since we cannot use server-side processing, implement a robust "Form Handler" pattern that supports:
  - **Provider Agnosticism:** Easy switching between Formspree, Web3Forms, or Google Forms.
  - **Client-Side Validation:** Zod-based schema validation in the browser before submission.
  - **Optimistic UI:** Immediate "Success" states to mask network latency.

### 3. Operational Rigor & CI/CD

_Goal: Treat the static site as a mission-critical product._

- **Automated Lighthouse & Accessibility Gates:** Configure GitHub Actions to run Lighthouse CI and Axe core checks on every Pull Request. The build should fail if accessibility scores drop below 95.
- **Visual Regression Testing:** Expand the Playwright suite to include visual snapshot testing for critical components (`Hero`, `PricingCard`, `Footer`) to catch layout shifts across viewports.
- **Broken Link Checker:** Implement a build-step validator (e.g., `astro-link-check`) to ensure no internal 404s are ever deployed.

### 4. Developer Experience (DX) & Tooling

_Goal: Make the repository a joy to work in._

- **Scaffolding CLI:** Create a simple CLI script (e.g., `npm run new:post` or `npm run new:component`) that generates the correct file structure, frontmatter, and boilerplate code to enforce consistency.
- **Strict Content Schemas:** Refine `src/content/config.ts` to enforce strict typing for all frontmatter, including image dimensions, author profiles, and SEO metadata.
- **Bundle Analysis:** Integrate `rollup-plugin-visualizer` to generate a report on every build, helping us keep the JavaScript footprint minimal.

---

## Execution Guidelines

1.  **No Server Functions:** All dynamic functionality must be achieved via build-time generation or client-side JavaScript APIs.
2.  **Progressive Enhancement:** Core content must be readable without JavaScript. Interactivity (search, filtering) should layer on top.
3.  **Type Safety:** All new code must be strictly typed. `any` is forbidden in new components.
4.  **Performance Budget:** Maintain a "Green" Core Web Vitals score. New libraries must be justified by their utility-to-weight ratio.

## Immediate Next Step

Select **one** objective from the list above (recommended: **Implement Client-Side Search** or **Automated OG Images**) and begin implementation.
