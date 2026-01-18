/**
 * Focus management for Astro page transitions.
 *
 * Goals:
 * - Keep focus in a sensible place after navigation for keyboard users.
 * - Avoid hijacking focus for pointer users.
 * - Be idempotent under Astro view transitions.
 */

import { createKeyboardNavigationDetector } from '../utils/keyboard';

declare global {
  interface Window {
    __focusManagementBound?: boolean;
  }
}

export function maybeFocusMainContentOnPageLoad(): void {
  // Only adjust focus for keyboard users.
  if (!document.body.classList.contains('keyboard-navigation')) return;

  // Respect explicit in-page anchors (and avoid fighting browser hash behavior).
  if (window.location.hash) return;

  // If something already has focus (e.g. an input, dialog, etc), don't override it.
  const active = document.activeElement as HTMLElement | null;
  if (
    active &&
    active !== document.body &&
    active !== document.documentElement
  ) {
    return;
  }

  const main = document.getElementById('main-content') as HTMLElement | null;
  if (!main) return;

  // Ensure it is focusable.
  if (!main.hasAttribute('tabindex')) {
    main.setAttribute('tabindex', '-1');
  }

  try {
    main.focus({ preventScroll: true });
  } catch {
    // Some environments don't support focus options.
    main.focus();
  }
}

function initOnce(): void {
  if (window.__focusManagementBound) return;
  window.__focusManagementBound = true;

  // Enable `body.keyboard-navigation` toggling.
  createKeyboardNavigationDetector();

  // Initial page load.
  queueMicrotask(() => {
    maybeFocusMainContentOnPageLoad();
  });

  // Astro view transitions.
  document.addEventListener('astro:page-load', () => {
    maybeFocusMainContentOnPageLoad();
  });

  // Back-forward cache restores can leave focus in odd places.
  window.addEventListener('pageshow', () => {
    maybeFocusMainContentOnPageLoad();
  });
}

if (typeof document !== 'undefined') {
  initOnce();
}

export {};
