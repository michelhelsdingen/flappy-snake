// Haptic feedback utility for mobile devices
// iOS Safari/Chrome don't support navigator.vibrate - all calls are wrapped in try/catch

class HapticManager {
  private supported: boolean;

  constructor() {
    // Check support AND test if it actually works (iOS lies about support)
    this.supported = false;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        // Try a zero-duration vibrate to test actual support
        this.supported = navigator.vibrate(0) !== false;
      }
    } catch {
      this.supported = false;
    }
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail - haptics are non-essential
    }
  }

  lightTap(): void {
    this.vibrate(10);
  }

  mediumImpact(): void {
    this.vibrate(25);
  }

  heavyImpact(): void {
    this.vibrate([30, 50, 30]);
  }

  success(): void {
    this.vibrate([15, 30, 15]);
  }

  error(): void {
    this.vibrate([100, 50, 100, 50, 100]);
  }

  achievement(): void {
    this.vibrate([50, 100, 50, 100, 50, 100, 200]);
  }

  celebration(): void {
    this.vibrate([100, 50, 100, 50, 200, 100, 300]);
  }
}

export const haptics = new HapticManager();
