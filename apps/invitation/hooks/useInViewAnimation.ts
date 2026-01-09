"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";

export type SlideDirection = "left" | "right" | "up" | "down";

interface UseInViewSlideInOptions {
  direction?: SlideDirection;
  threshold?: number;
  rootMargin?: string;
  distance?: number;
  delayMs?: number;
}

interface UseInViewSlideInResult {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
  isVisible: boolean;
}

export function useInViewSlideIn(options: UseInViewSlideInOptions = {}): UseInViewSlideInResult {
  const {
    direction = "left",
    // Trigger as soon as any pixel of the element enters the viewport
    // so animation starts right when the top edge appears on screen
    threshold = 0,
    rootMargin = "0px 0px 0px 0px",
    distance = 24,
    delayMs = 0,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  let initialTransform = "translate3d(0, 0, 0)";

  switch (direction) {
    case "right":
      initialTransform = `translate3d(${distance}px, 0, 0)`;
      break;
    case "up":
      initialTransform = `translate3d(0, ${distance}px, 0)`;
      break;
    case "down":
      initialTransform = `translate3d(0, -${distance}px, 0)`;
      break;
    case "left":
    default:
      initialTransform = `translate3d(-${distance}px, 0, 0)`;
      break;
  }

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translate3d(0, 0, 0)" : initialTransform,
    transition: `opacity 600ms ease-out ${delayMs}ms, transform 600ms ease-out ${delayMs}ms`,
    willChange: "opacity, transform",
  };

  return { ref, style, isVisible };
}
