/**
 * Mobile gesture handler for canvas interactions
 * Supports: pinch-to-zoom, momentum, double-tap, long-press
 */

export interface GestureCallbacks {
  onPinchZoom?: (scale: number, delta: number) => void;
  onRotate?: (
    deltaX: number,
    deltaY: number,
    velocity: { x: number; y: number }
  ) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  time: number;
}

export class MobileGestureHandler {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;

  private touches: Map<number, TouchPoint> = new Map();
  private lastTouchTime = 0;
  private lastTapTime = 0;
  private lastTapPos = { x: 0, y: 0 };
  private longPressTimer: number | null = null;
  private initialPinchDistance = 0;
  private lastPinchScale = 1;

  private lastDragPos = { x: 0, y: 0 };
  private lastDragTime = 0;
  private velocity = { x: 0, y: 0 };

  private gestureMode: 'none' | 'rotate' | 'scroll' | 'pinch' = 'none';
  private readonly dragIntentThresholdPx = 8;
  private readonly scrollDominanceRatio = 1.2;

  constructor(element: HTMLElement, callbacks: GestureCallbacks) {
    this.element = element;
    this.callbacks = callbacks;

    this.attachListeners();
  }

  private attachListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: false,
    });
  }

  private handleTouchStart = (e: TouchEvent) => {
    const now = performance.now();
    this.lastTouchTime = now;
    this.gestureMode = 'none';

    // Clear any existing long press timer
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Update touch points
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      });
    }

    if (e.touches.length === 1) {
      // Single touch - could be tap, long press, or drag
      const touch = e.touches[0];
      this.lastDragPos = { x: touch.clientX, y: touch.clientY };
      this.lastDragTime = now;

      // Check for double tap
      const tapDelta = now - this.lastTapTime;
      const tapDist = Math.hypot(
        touch.clientX - this.lastTapPos.x,
        touch.clientY - this.lastTapPos.y
      );

      if (tapDelta < 300 && tapDist < 30) {
        // Double tap detected
        this.callbacks.onDoubleTap?.(touch.clientX, touch.clientY);
        this.lastTapTime = 0; // Reset to prevent triple tap
        this.triggerHaptic('light');
      } else {
        this.lastTapTime = now;
        this.lastTapPos = { x: touch.clientX, y: touch.clientY };
      }

      // Set up long press detection
      this.longPressTimer = window.setTimeout(() => {
        if (this.touches.size === 1) {
          const currentTouch = Array.from(this.touches.values())[0];
          const moveDist = Math.hypot(
            currentTouch.x - this.lastTapPos.x,
            currentTouch.y - this.lastTapPos.y
          );

          // Only trigger if finger hasn't moved much
          if (moveDist < 10) {
            this.callbacks.onLongPress?.(currentTouch.x, currentTouch.y);
            this.triggerHaptic('medium');
          }
        }
        this.longPressTimer = null;
      }, 500);
    } else if (e.touches.length === 2) {
      // Pinch gestures should prevent default page zoom/scroll.
      e.preventDefault();
      this.gestureMode = 'pinch';

      // Two finger gesture - pinch or pan
      if (this.longPressTimer !== null) {
        window.clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.initialPinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      this.lastPinchScale = 1;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    const now = performance.now();

    // Cancel long press if finger moves
    if (this.longPressTimer !== null && e.touches.length === 1) {
      const touch = e.touches[0];
      const moveDist = Math.hypot(
        touch.clientX - this.lastTapPos.x,
        touch.clientY - this.lastTapPos.y
      );
      if (moveDist > 10) {
        window.clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }

    if (e.touches.length === 1) {
      // Single finger drag/rotate
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastDragPos.x;
      const deltaY = touch.clientY - this.lastDragPos.y;
      const dt = Math.max(1, now - this.lastDragTime);

      // Decide whether the user intends to scroll the page or rotate the model.
      // This keeps the canvas interaction usable without trapping vertical scroll.
      if (this.gestureMode === 'none') {
        const ax = Math.abs(deltaX);
        const ay = Math.abs(deltaY);
        const moved = Math.max(ax, ay);

        if (moved >= this.dragIntentThresholdPx) {
          if (ay > ax * this.scrollDominanceRatio) {
            this.gestureMode = 'scroll';
          } else {
            this.gestureMode = 'rotate';
          }
        }
      }

      if (this.gestureMode === 'scroll') {
        // Allow native scrolling.
        this.lastDragPos = { x: touch.clientX, y: touch.clientY };
        this.lastDragTime = now;
        return;
      }

      // Rotate mode: prevent the browser from handling the gesture.
      if (this.gestureMode === 'rotate') {
        e.preventDefault();
      }

      // Calculate velocity for momentum
      this.velocity.x = (deltaX / dt) * 1000;
      this.velocity.y = (deltaY / dt) * 1000;

      this.callbacks.onRotate?.(deltaX, deltaY, this.velocity);

      this.lastDragPos = { x: touch.clientX, y: touch.clientY };
      this.lastDragTime = now;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      this.gestureMode = 'pinch';

      // Pinch zoom or two-finger pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (this.initialPinchDistance > 0) {
        const scale = currentDistance / this.initialPinchDistance;
        const delta = scale - this.lastPinchScale;

        this.callbacks.onPinchZoom?.(scale, delta);
        this.lastPinchScale = scale;
      }

      // Two-finger pan (optional)
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      if (this.lastDragPos.x !== 0) {
        const deltaX = centerX - this.lastDragPos.x;
        const deltaY = centerY - this.lastDragPos.y;
        this.callbacks.onPan?.(deltaX, deltaY);
      }

      this.lastDragPos = { x: centerX, y: centerY };
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    // Clear long press timer
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Remove ended touches
    const currentTouchIds = new Set<number>();
    for (let i = 0; i < e.touches.length; i++) {
      currentTouchIds.add(e.touches[i].identifier);
    }

    for (const id of this.touches.keys()) {
      if (!currentTouchIds.has(id)) {
        this.touches.delete(id);
      }
    }

    // Reset pinch if all fingers lifted
    if (e.touches.length < 2) {
      this.initialPinchDistance = 0;
      this.lastPinchScale = 1;
    }

    // Reset drag position if no touches remain
    if (e.touches.length === 0) {
      this.lastDragPos = { x: 0, y: 0 };
      this.velocity = { x: 0, y: 0 };
      this.gestureMode = 'none';
    }
  };

  private handleTouchCancel = (_e: TouchEvent) => {
    this.touches.clear();
    this.initialPinchDistance = 0;
    this.lastPinchScale = 1;
    this.lastDragPos = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.gestureMode = 'none';

    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(patterns[intensity]);
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.touches.clear();
    this.gestureMode = 'none';
  }

  public getVelocity() {
    return { ...this.velocity };
  }
}
