import { useTransform, type MotionValue } from 'motion/react';

/**
 * Animation Helpers for Framer Motion
 * Reusable easing functions and interpolation utilities
 */

// Interpolation helper
export const interpolate = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

// Ultra-smooth easing functions with gentle start
export const easeInOutQuint = (t: number): number => {
  return t < 0.5
    ? 16 * t * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 5) / 2;
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeSmoothBelok = (t: number): number => {
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

/**
 * Create a useTransform with easing applied
 */
export const useEasedTransform = (
  progress: MotionValue<number>,
  inputRange: [number, number],
  outputRange: [number, number],
  easing: (t: number) => number = easeInOutCubic
) => {
  return useTransform(progress, (p: number) => {
    // Normalize progress to 0-1
    const normalized = (p - inputRange[0]) / (inputRange[1] - inputRange[0]);
    const clamped = Math.max(0, Math.min(1, normalized));
    const eased = easing(clamped);
    return interpolate(outputRange[0], outputRange[1], eased);
  });
};

/**
 * Create a conditional transform (different behavior based on progress threshold)
 */
export const useConditionalTransform = (
  progress: MotionValue<number>,
  threshold: number,
  beforeTransform: (p: number) => number,
  afterTransform: (p: number) => number
) => {
  return useTransform(progress, (p: number) => {
    if (p <= threshold) {
      return beforeTransform(p);
    } else {
      return afterTransform(p);
    }
  });
};

