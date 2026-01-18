import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import for side effects: the script binds to astro events and document clicks.
import '../../scripts/demo-lab';

describe('demo-lab script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    document.documentElement.removeAttribute('data-demo-paused');
    document.documentElement.removeAttribute('data-demo-reduced-motion');
    document.documentElement.removeAttribute('data-demo-perf');

    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is idempotent across repeated astro:page-load events', () => {
    const button = document.createElement('button');
    button.className = 'demo-toggle';
    button.dataset.demoToggle = 'paused';
    document.body.appendChild(button);

    const moduleEl = document.createElement('div');
    moduleEl.dataset.demoModule = 'true';
    document.body.appendChild(moduleEl);

    // Simulate multiple transition loads.
    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:page-load'));

    // One click should toggle once. If multiple click handlers were bound,
    // state would flip twice and end up back at false.
    button.click();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.demoPaused).toBe('true');
  });

  it('cleans up on astro:before-swap', () => {
    const button = document.createElement('button');
    button.className = 'demo-toggle';
    button.dataset.demoToggle = 'paused';
    document.body.appendChild(button);

    const moduleEl = document.createElement('div');
    moduleEl.dataset.demoModule = 'true';
    document.body.appendChild(moduleEl);

    document.dispatchEvent(new Event('astro:page-load'));

    // Toggle once to true
    button.click();
    expect(document.documentElement.dataset.demoPaused).toBe('true');

    // Simulate swap cleanup.
    document.dispatchEvent(new Event('astro:before-swap'));

    // Click should no longer toggle (listener removed).
    button.click();
    expect(document.documentElement.dataset.demoPaused).toBe('true');
  });
});
