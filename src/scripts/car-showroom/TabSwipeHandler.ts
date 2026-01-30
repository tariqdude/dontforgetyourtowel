/**
 * Tab swipe navigation for mobile
 * Allows swiping left/right to switch between tabs
 */

export class TabSwipeHandler {
  private element: HTMLElement;
  private onTabChange: (direction: 'next' | 'prev') => void;

  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private isDragging = false;
  private threshold = 50; // Minimum swipe distance
  private maxVerticalMovement = 30; // Max vertical movement to still count as horizontal swipe

  constructor(
    element: HTMLElement,
    onTabChange: (direction: 'next' | 'prev') => void
  ) {
    this.element = element;
    this.onTabChange = onTabChange;

    this.attachListeners();
  }

  private attachListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: true,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: true,
    });
  }

  private handleTouchStart = (e: TouchEvent) => {
    // Only handle single-finger swipes
    if (e.touches.length !== 1) return;

    // Don't interfere with scrollable elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input, select, textarea, button, a, [data-csr-no-swipe]')
    ) {
      return;
    }

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.isDragging = true;
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.currentX = touch.clientX;
    const deltaY = Math.abs(touch.clientY - this.startY);

    // If user is scrolling vertically, cancel the swipe
    if (deltaY > this.maxVerticalMovement) {
      this.isDragging = false;
      return;
    }
  };

  private handleTouchEnd = () => {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    const absDeltaX = Math.abs(deltaX);

    if (absDeltaX > this.threshold) {
      // Swipe detected
      if (deltaX > 0) {
        // Swipe right = previous tab
        this.onTabChange('prev');
        this.triggerHaptic();
      } else {
        // Swipe left = next tab
        this.onTabChange('next');
        this.triggerHaptic();
      }
    }

    this.isDragging = false;
    this.currentX = 0;
  };

  private triggerHaptic() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}
