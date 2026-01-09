'use client';

import dynamic from 'next/dynamic';

const LottiePlayer = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((m) => m.Player),
  {
    ssr: false,
  }
);

interface SwipeUpHintProps {
  dragProgress: number;
  currentSection: number;
  hasOpenedOnce: boolean;
}

export default function SwipeUpHint({
  dragProgress,
  currentSection,
  hasOpenedOnce,
}: SwipeUpHintProps) {
  // Hanya tampil jika user sudah pernah membuka undangan minimal sekali
  if (!hasOpenedOnce) {
    return null;
  }

  // Hanya untuk section 0 sampai 5
  if (currentSection < 0 || currentSection > 5) {
    return null;
  }

  const HINT_WINDOW = 0.05; // 5% sebelum & sesudah section

  const delta = Math.abs(dragProgress - currentSection);
  if (delta > HINT_WINDOW) {
    return null;
  }

  // Fade in/out linear: 0 di pinggir window, 1 di tepat section
  const maxOpacity = 0.8;
  const opacity = maxOpacity * (1 - delta / HINT_WINDOW);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 flex justify-center"
      style={{
        bottom: '1%',
        zIndex: 900,
        opacity,
        transition: 'opacity 180ms ease-out',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'opacity',
      }}
    >
      <LottiePlayer
        autoplay
        loop
        src="/swipeup.json"
        style={{ width: 80, height: 80, pointerEvents: 'none' }}
      />
    </div>
  );
}
