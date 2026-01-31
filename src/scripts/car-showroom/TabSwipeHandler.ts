/**
 * Enhanced Tab swipe navigation for mobile
 * Features:
 * - Visual feedback during swipe
 * - Velocity-based swipe detection
 * - Rubber-band effect at edges
 * - Edge indicators
 * - Reduced motion support
 */

export interface TabSwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  maxVerticalMovement?: number;
  rubberBandFactor?: number;
  animationDuration?: number;
}

export class TabSwipeHandler {
  private element: HTMLElement;
  private onTabChange: (direction: 'next' | 'prev') => void;

  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private isDragging = false;
  private startTime = 0;

  // Configuration
  private threshold: number;
  private velocityThreshold: number;
  private maxVerticalMovement: number;
  private rubberBandFactor: number;
  private animationDuration: number;

  // Visual feedback element
  private indicator: HTMLElement | null = null;
  private prefersReducedMotion: boolean;

  // Track position for velocity calculation
  private lastX = 0;
  private lastTime = 0;
  private velocity = 0;

  // Edge detection
  private isAtStart = true;
  private isAtEnd = false;

  constructor(
    element: HTMLElement,
    onTabChange: (direction: 'next' | 'prev') => void,
    options: TabSwipeOptions = {}
  ) {
    this.element = element;
    this.onTabChange = onTabChange;

    // Apply options with defaults
    this.threshold = options.threshold ?? 50;
    this.velocityThreshold = options.velocityThreshold ?? 0.3;
    this.maxVerticalMovement = options.maxVerticalMovement ?? 30;
    this.rubberBandFactor = options.rubberBandFactor ?? 0.3;
    this.animationDuration = options.animationDuration ?? 300;

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    this.createIndicator();
    this.attachListeners();
  }

  private createIndicator() {
    // Create visual swipe indicator element
    this.indicator = document.createElement('div');
    this.indicator.className = 'csr-swipe-indicator';
    this.indicator.setAttribute('aria-hidden', 'true');
    this.indicator.innerHTML = `
      <div class="csr-swipe-indicator__arrow csr-swipe-indicator__arrow--left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
      <div class="csr-swipe-indicator__arrow csr-swipe-indicator__arrow--right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    `;
    this.element.style.position = 'relative';
    this.element.appendChild(this.indicator);
  }

  private attachListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: true,
    });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: true,
    });

    // Listen for reduced motion changes
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', this.handleReducedMotionChange);
  }

  private handleReducedMotionChange = (e: MediaQueryListEvent) => {
    this.prefersReducedMotion = e.matches;
  };

  private handleTouchStart = (e: TouchEvent) => {
    // Only handle single-finger swipes
    if (e.touches.length !== 1) return;

    // Don't interfere with scrollable elements or interactive controls
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'input, select, textarea, button, a, [data-csr-no-swipe], .csr-accordion'
      )
    ) {
      return;
    }

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
    this.lastX = touch.clientX;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.velocity = 0;
    this.isDragging = true;

    // Update edge state
    this.updateEdgeState();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const now = performance.now();

    this.currentX = touch.clientX;
    this.currentY = touch.clientY;

    const deltaX = this.currentX - this.startX;
    const deltaY = Math.abs(this.currentY - this.startY);

    // If user is scrolling vertically, cancel the swipe
    if (deltaY > this.maxVerticalMovement) {
      this.cancelSwipe();
      return;
    }

    // Calculate velocity
    const dt = Math.max(1, now - this.lastTime);
    this.velocity = (this.currentX - this.lastX) / dt;
    this.lastX = this.currentX;
    this.lastTime = now;

    // Prevent default if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }

    // Update visual feedback
    this.updateVisualFeedback(deltaX);
  };

  private handleTouchEnd = () => {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    const absDeltaX = Math.abs(deltaX);
    const duration = performance.now() - this.startTime;

    // Calculate if swipe should trigger based on distance OR velocity
    const velocitySwipe = Math.abs(this.velocity) > this.velocityThreshold;
    const distanceSwipe = absDeltaX > this.threshold;

    // Check edge constraints
    const swipingToPrev = deltaX > 0;
    const swipingToNext = deltaX < 0;
    const canSwipePrev = !this.isAtStart || distanceSwipe;
    const canSwipeNext = !this.isAtEnd || distanceSwipe;

    if ((distanceSwipe || velocitySwipe) && duration < 500) {
      if (swipingToPrev && canSwipePrev) {
        this.animateTransition('prev');
        this.onTabChange('prev');
        this.triggerHaptic('success');
      } else if (swipingToNext && canSwipeNext) {
        this.animateTransition('next');
        this.onTabChange('next');
        this.triggerHaptic('success');
      } else {
        // Edge bounce - rubber band effect
        this.animateRubberBand(deltaX > 0 ? 'left' : 'right');
        this.triggerHaptic('warning');
      }
    } else {
      // Snap back
      this.resetVisualFeedback();
    }

    this.isDragging = false;
    this.currentX = 0;
    this.velocity = 0;
  };

  private handleTouchCancel = () => {
    this.cancelSwipe();
  };

  private cancelSwipe() {
    this.isDragging = false;
    this.currentX = 0;
    this.velocity = 0;
    this.resetVisualFeedback();
  }

  private updateEdgeState() {
    // This could be set externally based on current tab position
    // For now, we'll track it via CSS classes on the element
    const parent = this.element.closest('[data-csr-tab-position]');
    if (parent) {
      const position = parent.getAttribute('data-csr-tab-position');
      this.isAtStart = position === 'first';
      this.isAtEnd = position === 'last';
    }
  }

  private updateVisualFeedback(deltaX: number) {
    if (!this.indicator || this.prefersReducedMotion) return;

    const progress = Math.min(Math.abs(deltaX) / (this.threshold * 2), 1);
    const direction = deltaX > 0 ? 'left' : 'right';

    // Apply rubber band at edges
    let visualDelta = deltaX;
    if ((deltaX > 0 && this.isAtStart) || (deltaX < 0 && this.isAtEnd)) {
      visualDelta = deltaX * this.rubberBandFactor;
    }

    // Update indicator visibility and position
    this.indicator.style.opacity = String(progress * 0.8);
    this.indicator.setAttribute('data-direction', direction);
    this.indicator.setAttribute('data-progress', String(progress));

    // Subtle parallax on content
    const panels = this.element.querySelectorAll<HTMLElement>(
      '[data-csr-tab-panel]:not([hidden])'
    );
    panels.forEach(panel => {
      panel.style.transform = `translateX(${visualDelta * 0.1}px)`;
      panel.style.transition = 'none';
    });
  }

  private resetVisualFeedback() {
    if (!this.indicator) return;

    this.indicator.style.opacity = '0';
    this.indicator.removeAttribute('data-direction');
    this.indicator.removeAttribute('data-progress');

    // Reset panel position with animation
    const panels = this.element.querySelectorAll<HTMLElement>(
      '[data-csr-tab-panel]:not([hidden])'
    );
    panels.forEach(panel => {
      panel.style.transition = this.prefersReducedMotion
        ? 'none'
        : `transform ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      panel.style.transform = 'translateX(0)';
    });
  }

  private animateTransition(direction: 'next' | 'prev') {
    if (this.prefersReducedMotion) {
      this.resetVisualFeedback();
      return;
    }

    const panels = this.element.querySelectorAll<HTMLElement>(
      '[data-csr-tab-panel]:not([hidden])'
    );
    const exitDirection = direction === 'next' ? -1 : 1;

    panels.forEach(panel => {
      panel.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${this.animationDuration}ms ease`;
      panel.style.transform = `translateX(${exitDirection * 30}px)`;
      panel.style.opacity = '0';
    });

    // Reset after animation
    setTimeout(() => {
      panels.forEach(panel => {
        panel.style.transition = 'none';
        panel.style.transform = 'translateX(0)';
        panel.style.opacity = '1';
      });
      this.resetVisualFeedback();
    }, this.animationDuration);
  }

  private animateRubberBand(direction: 'left' | 'right') {
    if (this.prefersReducedMotion) {
      this.resetVisualFeedback();
      return;
    }

    const bounce = direction === 'left' ? 20 : -20;
    const panels = this.element.querySelectorAll<HTMLElement>(
      '[data-csr-tab-panel]:not([hidden])'
    );

    panels.forEach(panel => {
      panel.style.transition = `transform ${this.animationDuration / 2}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      panel.style.transform = `translateX(${bounce}px)`;
    });

    setTimeout(() => {
      panels.forEach(panel => {
        panel.style.transition = `transform ${this.animationDuration / 2}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        panel.style.transform = 'translateX(0)';
      });
      this.resetVisualFeedback();
    }, this.animationDuration / 2);
  }

  private triggerHaptic(type: 'success' | 'warning' | 'error') {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [10],
        warning: [5, 50, 5],
        error: [20, 100, 20],
      };
      navigator.vibrate(patterns[type]);
    }
  }

  public setEdgeState(isAtStart: boolean, isAtEnd: boolean) {
    this.isAtStart = isAtStart;
    this.isAtEnd = isAtEnd;
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .removeEventListener('change', this.handleReducedMotionChange);

    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
  }
}
