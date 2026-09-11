/**
 * Utility for triggering subtle haptic feedback vibration on supported mobile devices
 * via the standard HTML5 Vibration API (navigator.vibrate).
 */

let lastVibrateTime = 0;

/**
 * Triggers a subtle heartbeat haptic feedback vibration sequence.
 * Uses a double-pulse pattern reminiscent of a natural "lub-dub" heartbeat:
 *   - 35ms soft initial contraction
 *   - 60ms brief diastolic pause
 *   - 50ms firm ventricular heartbeat
 *
 * Includes rate-limiting to prevent overlapping or rapid-fire vibration bursts.
 */
export function triggerHeartbeatHaptic(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const now = Date.now();
  if (now - lastVibrateTime < 400) {
    return false; // Prevent duplicate triggers within 400ms
  }
  lastVibrateTime = now;

  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      // Subtle lub-dub physiological heartbeat vibration sequence
      return navigator.vibrate([35, 60, 50]);
    } catch {
      // Silently fall back if the device or browser doesn't support or disallows vibration
      return false;
    }
  }

  return false;
}
