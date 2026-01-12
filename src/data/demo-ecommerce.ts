import img1Url from '../assets/blog-placeholder-1.jpg?url';
import img2Url from '../assets/blog-placeholder-2.jpg?url';
import img3Url from '../assets/blog-placeholder-3.jpg?url';
import img4Url from '../assets/blog-placeholder-4.jpg?url';
import img5Url from '../assets/blog-placeholder-5.jpg?url';
import imgAboutUrl from '../assets/blog-placeholder-about.jpg?url';

export type DemoProductVariant = {
  id: string;
  label: string;
  swatch?: string;
};

export type DemoProduct = {
  id: string;
  name: string;
  brand: string;
  description: string;
  bullets: string[];
  specs?: Record<string, string>;
  priceCents: number;
  compareAtCents?: number;
  rating: number; // 0-5
  reviewCount: number;
  tags: string[];
  images: string[];
  colors: DemoProductVariant[];
  sizes: DemoProductVariant[];
  inventory?: number;
  featured?: boolean;
};

export const demoProducts: DemoProduct[] = [
  {
    id: 'aurora-hoodie',
    name: 'Aurora Knit Hoodie',
    brand: 'dontforgetyourtowel Atelier',
    description:
      'A premium knit hoodie with a soft-touch interior and a structured drape—built for daily wear and camera-ready detail.',
    bullets: [
      'Breathable knit blend (all-season)',
      'Reinforced seams + hidden phone pocket',
      'Color-locked dye (fade resistant)',
    ],
    specs: {
      Material: 'Knit blend',
      Fit: 'Relaxed',
      Care: 'Machine wash cold',
      Weight: 'Midweight',
    },
    priceCents: 12900,
    compareAtCents: 15900,
    rating: 4.8,
    reviewCount: 412,
    tags: ['apparel', 'featured', 'new'],
    images: [img3Url, img5Url, img1Url],
    colors: [
      { id: 'obsidian', label: 'Obsidian', swatch: '#0b0b0f' },
      { id: 'glacier', label: 'Glacier', swatch: '#cfe7ff' },
      { id: 'ember', label: 'Ember', swatch: '#ff6a3d' },
    ],
    sizes: [
      { id: 'xs', label: 'XS' },
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'l', label: 'L' },
      { id: 'xl', label: 'XL' },
    ],
    inventory: 42,
    featured: true,
  },
  {
    id: 'spectral-sneaker',
    name: 'Spectral Runner',
    brand: 'dontforgetyourtowel Atelier',
    description:
      'A lightweight runner with a responsive sole and a clean silhouette. Built for comfort, styled for everything else.',
    bullets: [
      'Cushioned midsole with rebound feel',
      'Breathable upper + stability collar',
      'Grip pattern tuned for city surfaces',
    ],
    specs: {
      Upper: 'Breathable mesh',
      Sole: 'Responsive foam',
      Drop: '8mm',
      Use: 'City / daily miles',
    },
    priceCents: 18900,
    compareAtCents: 21900,
    rating: 4.7,
    reviewCount: 268,
    tags: ['footwear', 'featured'],
    images: [img4Url, img2Url, imgAboutUrl],
    colors: [
      { id: 'void', label: 'Void', swatch: '#0f172a' },
      { id: 'cloud', label: 'Cloud', swatch: '#e2e8f0' },
      { id: 'electric', label: 'Electric', swatch: '#3b82f6' },
    ],
    sizes: [
      { id: '8', label: '8' },
      { id: '9', label: '9' },
      { id: '10', label: '10' },
      { id: '11', label: '11' },
      { id: '12', label: '12' },
    ],
    inventory: 18,
    featured: true,
  },
  {
    id: 'prism-bag',
    name: 'Prism Carry Tote',
    brand: 'dontforgetyourtowel Atelier',
    description:
      'A structured tote with an adaptive interior. Designed for work, travel, and the inevitable “can you carry this?” moments.',
    bullets: [
      'Laptop sleeve + magnetic closure',
      'Water-repellent finish',
      'Quick-access key clip',
    ],
    specs: {
      Capacity: '14" laptop + daily carry',
      Closure: 'Magnetic',
      Finish: 'Water-repellent',
      Pockets: 'Organizer + key clip',
    },
    priceCents: 9900,
    rating: 4.6,
    reviewCount: 153,
    tags: ['accessories'],
    images: [img5Url, img1Url, img2Url],
    colors: [
      { id: 'midnight', label: 'Midnight', swatch: '#0b1220' },
      { id: 'stone', label: 'Stone', swatch: '#cbd5e1' },
    ],
    sizes: [{ id: 'one', label: 'One size' }],
    inventory: 66,
  },
  {
    id: 'lumen-mug',
    name: 'Lumen Ceramic Mug',
    brand: 'dontforgetyourtowel Atelier',
    description:
      'A ceramic mug with a balanced lip and a satisfying weight. The kind you “accidentally” use every day.',
    bullets: ['Dishwasher safe', 'Heat-retention glaze', 'Ergonomic handle'],
    specs: {
      Material: 'Ceramic',
      Finish: 'Heat-retention glaze',
      Care: 'Dishwasher safe',
      Handle: 'Ergonomic',
    },
    priceCents: 2400,
    rating: 4.9,
    reviewCount: 811,
    tags: ['home'],
    images: [img2Url, img3Url, imgAboutUrl],
    colors: [
      { id: 'cream', label: 'Cream', swatch: '#f8fafc' },
      { id: 'graphite', label: 'Graphite', swatch: '#1f2937' },
      { id: 'cobalt', label: 'Cobalt', swatch: '#1d4ed8' },
    ],
    sizes: [
      { id: '12oz', label: '12oz' },
      { id: '16oz', label: '16oz' },
    ],
    inventory: 120,
  },
];
