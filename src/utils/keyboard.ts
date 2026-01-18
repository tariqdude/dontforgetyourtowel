/**
 * Keyboard Utilities
 * @module utils/keyboard
 * @description Keyboard event handling, shortcuts, hotkeys, and focus management.
 */

import { isBrowser } from './dom';

/**
 * Common key codes
 */
export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
} as const;

export type KeyName = (typeof Keys)[keyof typeof Keys];

/**
 * Modifier keys
 */
export interface Modifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Shortcut definition
 */
export interface Shortcut {
  key: string;
  modifiers?: Modifiers;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Parse a shortcut string like "ctrl+shift+k" into a Shortcut object
 * @param shortcut - Shortcut string (e.g., "ctrl+k", "cmd+shift+p")
 */
export function parseShortcut(shortcut: string): Shortcut {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop() || '';

  const modifiers: Modifiers = {};
  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        modifiers.ctrl = true;
        break;
      case 'alt':
      case 'option':
        modifiers.alt = true;
        break;
      case 'shift':
        modifiers.shift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win':
      case 'windows':
        modifiers.meta = true;
        break;
    }
  }

  return { key, modifiers };
}

/**
 * Format a shortcut for display (platform-aware)
 * @param shortcut - Shortcut definition or string
 */
export function formatShortcut(shortcut: Shortcut | string): string {
  const parsed =
    typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
  const isMac = isBrowser() && navigator.platform.toUpperCase().includes('MAC');

  const parts: string[] = [];

  if (parsed.modifiers?.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (parsed.modifiers?.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (parsed.modifiers?.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (parsed.modifiers?.meta) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  // Format the key
  const keyDisplay =
    parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key;
  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Check if a keyboard event matches a shortcut
 * @param event - Keyboard event
 * @param shortcut - Shortcut to match
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Shortcut | string
): boolean {
  const parsed =
    typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;

  // Check key (case-insensitive for letters)
  const eventKey = event.key.toLowerCase();
  const targetKey = parsed.key.toLowerCase();

  if (eventKey !== targetKey) {
    return false;
  }

  // Check modifiers
  const mods = parsed.modifiers || {};
  if (!!mods.ctrl !== event.ctrlKey) return false;
  if (!!mods.alt !== event.altKey) return false;
  if (!!mods.shift !== event.shiftKey) return false;
  if (!!mods.meta !== event.metaKey) return false;

  return true;
}

/**
 * Hotkey handler type
 */
export type HotkeyHandler = (event: KeyboardEvent) => void | boolean;

/**
 * Hotkey registration options
 */
export interface HotkeyOptions {
  /** Execute even when input elements are focused */
  enableOnInput?: boolean;
  /** Execute even when contenteditable elements are focused */
  enableOnContentEditable?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
  /** Only trigger on keydown (default) or keyup */
  event?: 'keydown' | 'keyup';
  /** Scope/namespace for the hotkey */
  scope?: string;
}

interface RegisteredHotkey {
  shortcut: Shortcut;
  handler: HotkeyHandler;
  options: HotkeyOptions;
}

/**
 * Create a hotkey manager
 * @example
 * const hotkeys = createHotkeyManager();
 *
 * hotkeys.register('ctrl+k', () => openSearch());
 * hotkeys.register('ctrl+s', () => save(), { preventDefault: true });
 * hotkeys.register('escape', () => closeModal());
 *
 * // Clean up
 * hotkeys.destroy();
 */
export function createHotkeyManager() {
  const registeredHotkeys: RegisteredHotkey[] = [];
  let activeScope: string | null = null;
  let isPaused = false;

  const handleKeyEvent = (
    event: KeyboardEvent,
    eventType: 'keydown' | 'keyup'
  ) => {
    if (isPaused) return;

    // Check if we should ignore this event based on target
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT';
    const isContentEditable = target.isContentEditable;

    for (const { shortcut, handler, options } of registeredHotkeys) {
      // Skip if event type doesn't match
      if ((options.event || 'keydown') !== eventType) continue;

      // Skip if scope doesn't match
      if (activeScope !== null && options.scope !== activeScope) continue;

      // Skip if on input and not enabled
      if (isInput && !options.enableOnInput) continue;
      if (isContentEditable && !options.enableOnContentEditable) continue;

      // Check if shortcut matches
      if (!matchesShortcut(event, shortcut)) continue;

      // Execute handler
      const result = handler(event);

      // Handle preventDefault and stopPropagation
      if (options.preventDefault || shortcut.preventDefault) {
        event.preventDefault();
      }
      if (options.stopPropagation) {
        event.stopPropagation();
      }

      // If handler returns false, stop processing
      if (result === false) break;
    }
  };

  const keydownHandler = (e: KeyboardEvent) => handleKeyEvent(e, 'keydown');
  const keyupHandler = (e: KeyboardEvent) => handleKeyEvent(e, 'keyup');

  if (isBrowser()) {
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
  }

  return {
    /**
     * Register a hotkey
     * @param shortcut - Shortcut string (e.g., "ctrl+k") or Shortcut object
     * @param handler - Function to call when hotkey is pressed
     * @param options - Registration options
     * @returns Unregister function
     */
    register(
      shortcut: string | Shortcut,
      handler: HotkeyHandler,
      options: HotkeyOptions = {}
    ): () => void {
      const parsed =
        typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
      const registration: RegisteredHotkey = {
        shortcut: parsed,
        handler,
        options,
      };

      registeredHotkeys.push(registration);

      return () => {
        const index = registeredHotkeys.indexOf(registration);
        if (index !== -1) {
          registeredHotkeys.splice(index, 1);
        }
      };
    },

    /**
     * Unregister all hotkeys matching a shortcut
     */
    unregister(shortcut: string | Shortcut): void {
      const parsed =
        typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;
      for (let i = registeredHotkeys.length - 1; i >= 0; i--) {
        const reg = registeredHotkeys[i];
        if (
          reg.shortcut.key === parsed.key &&
          JSON.stringify(reg.shortcut.modifiers) ===
            JSON.stringify(parsed.modifiers)
        ) {
          registeredHotkeys.splice(i, 1);
        }
      }
    },

    /**
     * Set active scope (only hotkeys with this scope will fire)
     */
    setScope(scope: string | null): void {
      activeScope = scope;
    },

    /**
     * Get active scope
     */
    getScope(): string | null {
      return activeScope;
    },

    /**
     * Pause all hotkey handling
     */
    pause(): void {
      isPaused = true;
    },

    /**
     * Resume hotkey handling
     */
    resume(): void {
      isPaused = false;
    },

    /**
     * Check if paused
     */
    isPaused(): boolean {
      return isPaused;
    },

    /**
     * Get all registered hotkeys
     */
    getRegistered(): Array<{ shortcut: Shortcut; description?: string }> {
      return registeredHotkeys.map(r => ({
        shortcut: r.shortcut,
        description: r.shortcut.description,
      }));
    },

    /**
     * Clean up and remove all event listeners
     */
    destroy(): void {
      registeredHotkeys.length = 0;
      if (isBrowser()) {
        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('keyup', keyupHandler);
      }
    },
  };
}

// ============================================================================
// Focus Trap
// ============================================================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    el => el.offsetParent !== null // Filter out hidden elements
  );
}

/**
 * Create a focus trap within a container
 * @param container - Container element to trap focus within
 * @example
 * const trap = createFocusTrap(modalElement);
 * trap.activate();
 * // ... later
 * trap.deactivate();
 */
export function createFocusTrap(container: HTMLElement) {
  let isActive = false;
  let previouslyFocused: HTMLElement | null = null;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift+Tab: Going backwards
      if (current === first || !container.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: Going forward
      if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return {
    /**
     * Activate the focus trap
     * @param initialFocus - Element to focus initially, or first focusable if not specified
     */
    activate(initialFocus?: HTMLElement): void {
      if (isActive) return;
      isActive = true;

      // Store currently focused element
      previouslyFocused = document.activeElement as HTMLElement;

      // Focus initial element
      if (initialFocus) {
        initialFocus.focus();
      } else {
        const focusable = getFocusableElements(container);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }

      document.addEventListener('keydown', handleKeyDown);
    },

    /**
     * Deactivate the focus trap and restore focus
     */
    deactivate(): void {
      if (!isActive) return;
      isActive = false;

      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    },

    /**
     * Check if focus trap is active
     */
    isActive(): boolean {
      return isActive;
    },

    /**
     * Update focusable elements (call if content changes)
     */
    update(): HTMLElement[] {
      return getFocusableElements(container);
    },
  };
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Options for roving tabindex navigation
 */
export interface RovingTabindexOptions {
  /** Orientation of the list */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Loop around when reaching the end */
  loop?: boolean;
  /** Allow Home/End keys for first/last navigation */
  homeEnd?: boolean;
  /** Callback when selection changes */
  onSelect?: (element: HTMLElement, index: number) => void;
}

/**
 * Create roving tabindex navigation for a list of elements
 * @param container - Container element
 * @param selector - Selector for navigable items
 * @param options - Navigation options
 * @example
 * const roving = createRovingTabindex(menuElement, '[role="menuitem"]', {
 *   orientation: 'vertical',
 *   loop: true,
 * });
 */
export function createRovingTabindex(
  container: HTMLElement,
  selector: string,
  options: RovingTabindexOptions = {}
) {
  const {
    orientation = 'both',
    loop = true,
    homeEnd = true,
    onSelect,
  } = options;

  let currentIndex = 0;

  const getItems = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  };

  const updateTabindex = (items: HTMLElement[], index: number) => {
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1');
    });
  };

  const focusItem = (index: number) => {
    const items = getItems();
    if (items.length === 0) return;

    // Handle bounds
    if (loop) {
      index = ((index % items.length) + items.length) % items.length;
    } else {
      index = Math.max(0, Math.min(index, items.length - 1));
    }

    currentIndex = index;
    updateTabindex(items, index);
    items[index].focus();
    onSelect?.(items[index], index);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const items = getItems();
    if (items.length === 0) return;

    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;

      case 'Home':
        if (homeEnd) {
          focusItem(0);
          handled = true;
        }
        break;

      case 'End':
        if (homeEnd) {
          focusItem(items.length - 1);
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  // Initialize
  const items = getItems();
  updateTabindex(items, currentIndex);

  container.addEventListener('keydown', handleKeyDown);

  return {
    /**
     * Focus a specific item by index
     */
    focus(index: number): void {
      focusItem(index);
    },

    /**
     * Get current focused index
     */
    getCurrentIndex(): number {
      return currentIndex;
    },

    /**
     * Update items (call when list changes)
     */
    update(): void {
      const items = getItems();
      if (currentIndex >= items.length) {
        currentIndex = Math.max(0, items.length - 1);
      }
      updateTabindex(items, currentIndex);
    },

    /**
     * Clean up event listeners
     */
    destroy(): void {
      container.removeEventListener('keydown', handleKeyDown);
    },
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user is using a keyboard for navigation
 */
export function createKeyboardNavigationDetector() {
  if (!isBrowser()) {
    return {
      isKeyboardUser: () => false,
      destroy: () => {},
    };
  }

  let isKeyboardUser = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      isKeyboardUser = true;
      document.body.classList.add('keyboard-navigation');
    }
  };

  const handleMouseDown = () => {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-navigation');
  };

  const handlePointerDown = () => {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-navigation');
  };

  const handleTouchStart = () => {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-navigation');
  };

  document.addEventListener('keydown', handleKeyDown);
  // Prefer pointer/touch where available so touch interactions clear keyboard mode.
  document.addEventListener('pointerdown', handlePointerDown, {
    passive: true,
  } as AddEventListenerOptions);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('touchstart', handleTouchStart, {
    passive: true,
  } as AddEventListenerOptions);

  return {
    isKeyboardUser: () => isKeyboardUser,
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
    },
  };
}
