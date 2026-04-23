'use client';

/**
 * Haptic + Sound Feedback Utility
 * Provides tactile vibration on mobile and audio click on all devices
 */

// Vibration patterns (milliseconds)
export const HapticPattern = {
  light: [30],
  medium: [50],
  heavy: [80],
  success: [50, 50, 50],
  error: [100, 50, 100],
  warning: [80, 30, 80],
  double: [30, 30, 30],
} as const;

export type HapticPatternKey = keyof typeof HapticPattern;

/**
 * Trigger device vibration (works on mobile browsers with Vibration API)
 */
export function triggerHaptic(pattern: HapticPatternKey = 'light'): void {
  if (typeof navigator === 'undefined') return;
  if ('vibrate' in navigator) {
    navigator.vibrate(HapticPattern[pattern]);
  }
}

/**
 * Play a subtle click sound using Web Audio API (no external files needed)
 */
export function playClickSound(
  type: 'click' | 'success' | 'error' | 'pop' = 'click'
): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const configs = {
      click: { freq: 800, duration: 0.04, gain: 0.08 },
      success: { freq: 1200, duration: 0.08, gain: 0.06 },
      error: { freq: 300, duration: 0.12, gain: 0.1 },
      pop: { freq: 600, duration: 0.06, gain: 0.07 },
    };

    const { freq, duration, gain } = configs[type];

    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      freq * 0.5,
      ctx.currentTime + duration
    );

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    // Clean up
    oscillator.onended = () => ctx.close();
  } catch {
    // AudioContext not available — silent fail
  }
}

/**
 * Combined haptic + sound feedback for interactive elements
 */
export function feedback(
  hapticType: HapticPatternKey = 'light',
  soundType: 'click' | 'success' | 'error' | 'pop' = 'click'
): void {
  triggerHaptic(hapticType);
  playClickSound(soundType);
}
