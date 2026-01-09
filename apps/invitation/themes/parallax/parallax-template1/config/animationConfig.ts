/**
 * Configuration untuk animasi dan transisi antar section
 * Struktur simple: setiap section punya config untuk next dan prev
 */

export interface SectionTransitionConfig {
  // Durasi transisi (dalam milliseconds)
  duration: number;

  // Easing function untuk animation
  easing: string; // 'ease-out', 'ease-in', 'ease-in-out', 'linear'

  // Easing function custom untuk snap (opsional, jika tidak ada gunakan easing string)
  snapEasing?: (t: number) => number;

  // Easing function khusus untuk fade opacity (opsional, untuk ultra smooth fade)
  fadeEasing?: string; // CSS cubic-bezier atau easing function
}

export interface SectionConfig {
  // Config untuk transisi ke section berikutnya (next)
  next?: SectionTransitionConfig;
  
  // Config untuk transisi ke section sebelumnya (prev)
  prev?: SectionTransitionConfig;
}

export interface SimpleAnimationConfig {
  // Config untuk setiap section (0-7)
  sections: {
    0?: SectionConfig; // Section 0 (Cover)
    1?: SectionConfig; // Section 1
    2?: SectionConfig; // Section 2
    3?: SectionConfig; // Section 3
    4?: SectionConfig; // Section 4
    5?: SectionConfig; // Section 5
    6?: SectionConfig; // Section 6
    7?: SectionConfig; // Section 7
  };
  
  // Config global untuk momentum scroll
  momentum: {
    friction: number; // Friction untuk momentum (0-1)
    minVelocity: number; // Minimum velocity untuk stop momentum
  };
  
  // Config global untuk drag sensitivity
  dragSensitivity: number; // Sensitivitas drag (1 = 1:1 ratio)

  swipeDistanceThresholdRatio: number;
}

export interface AnimationConfig {
  snapDuration: number;
  snapEasing: (t: number) => number;
  momentumFriction: number;
  minVelocity: number;
  dragSensitivity: number;
  swipeDistanceThresholdRatio: number;
}

/**
 * Animation configuration - Atur sendiri kecepatan untuk setiap next/prev
 */
export const animationConfig: SimpleAnimationConfig = {
  sections: {
    // Section 0: Cover
    0: {
      next: {
        // Animasi ke section 1 - Ultra smooth fade dengan duration panjang
        duration: 2000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3), // Ease-out cubic untuk parallax
        // Custom fade easing yang sangat smooth
        fadeEasing: 'cubic-bezier(0.23, 0.32, 0.32, 0.95)', // Ultra smooth easing
      },
      // prev tidak ada karena section pertama
    },
    
    // Section 1
    1: {
      next: {
        // Animasi ke section 2
        duration: 7000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        // Animasi kembali ke section 0 - Optimized duration untuk performa
        duration: 2000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 2
    2: {
      next: {
        // Animasi ke section 3
        duration: 4000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        // Animasi kembali ke section 1
        duration: 7000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 3
    3: {
      next: {
        duration: 10000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        duration: 8000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 4
    4: {
      next: {
        duration: 5000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        duration: 10000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 5
    5: {
      next: {
        duration: 2000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        duration: 4000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 6
    6: {
      next: {
        duration: 4000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
      prev: {
        duration: 4000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
    
    // Section 7
    7: {
      // next tidak ada karena section terakhir
      prev: {
        duration: 4000,
        easing: 'ease-out',
        snapEasing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    },
  },
  
  // Config global untuk momentum
  momentum: {
    friction: 0.92, // 8% friction per frame
    minVelocity: 0.01,
  },
  
  // Config global untuk drag
  dragSensitivity: 0.5, // 1:1 ratio

  swipeDistanceThresholdRatio: 0.08,
};

/**
 * Default animation config untuk hooks berbasis drag (mis. useVerticalSwipe)
 */
export const defaultAnimationConfig: AnimationConfig = {
  snapDuration: animationConfig.sections[1]?.next?.duration || 400,
  snapEasing:
    animationConfig.sections[1]?.next?.snapEasing ||
    ((t: number) => 1 - Math.pow(1 - t, 3)),
  momentumFriction: animationConfig.momentum.friction,
  minVelocity: animationConfig.momentum.minVelocity,
  dragSensitivity: animationConfig.dragSensitivity,
  swipeDistanceThresholdRatio: animationConfig.swipeDistanceThresholdRatio,
};

/**
 * Helper function untuk mendapatkan config transisi
 */
export function getTransitionConfig(
  config: SimpleAnimationConfig,
  fromSection: number,
  toSection: number
): SectionTransitionConfig | null {
  const sectionConfig = config.sections[fromSection as keyof typeof config.sections];
  if (!sectionConfig) return null;
  
  // Tentukan apakah ini next atau prev
  const isNext = toSection > fromSection;
  
  if (isNext) {
    return sectionConfig.next || null;
  } else {
    return sectionConfig.prev || null;
  }
}

/**
 * Helper function untuk mendapatkan easing function
 */
export function getEasingFunction(
  transitionConfig: SectionTransitionConfig
): (t: number) => number {
  // Jika ada custom snapEasing, gunakan itu
  if (transitionConfig.snapEasing) {
    return transitionConfig.snapEasing;
  }
  
  // Otherwise, convert easing string ke function
  switch (transitionConfig.easing) {
    case 'ease-out':
      return (t: number) => 1 - Math.pow(1 - t, 3); // Cubic ease-out
    case 'ease-in':
      return (t: number) => Math.pow(t, 3); // Cubic ease-in
    case 'ease-in-out':
      return (t: number) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
    case 'linear':
      return (t: number) => t;
    default:
      return (t: number) => 1 - Math.pow(1 - t, 3); // Default: ease-out
  }
}

/**
 * Helper untuk mendapatkan default duration dan easing untuk CSS transition
 * Digunakan untuk fade dan transform yang tidak spesifik ke section tertentu
 * Menggunakan nilai rata-rata dari semua transisi atau nilai default
 */
export function getDefaultTransitionValues(config: SimpleAnimationConfig): {
  duration: number;
  easing: string;
} {
  // Ambil semua duration dari semua transisi untuk mendapatkan rata-rata
  const durations: number[] = [];
  const easings: string[] = [];
  
  Object.values(config.sections).forEach((section) => {
    if (section?.next) {
      durations.push(section.next.duration);
      easings.push(section.next.easing);
    }
    if (section?.prev) {
      durations.push(section.prev.duration);
      easings.push(section.prev.easing);
    }
  });
  
  // Hitung rata-rata duration, atau gunakan default
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 400;
  
  // Gunakan easing yang paling umum, atau default
  const mostCommonEasing = easings.length > 0
    ? easings[0] // Ambil yang pertama sebagai default
    : 'ease-out';
  
  return {
    duration: avgDuration,
    easing: mostCommonEasing,
  };
}

/**
 * Helper untuk mendapatkan transition values berdasarkan section saat ini dan target
 * Lebih akurat untuk CSS transition yang spesifik ke transisi tertentu
 */
export function getTransitionValuesForSection(
  config: SimpleAnimationConfig,
  fromSection: number,
  toSection: number
): {
  duration: number;
  easing: string;
} {
  const transitionConfig = getTransitionConfig(config, fromSection, toSection);
  
  if (transitionConfig) {
    return {
      duration: transitionConfig.duration,
      easing: transitionConfig.easing,
    };
  }
  
  // Fallback ke default
  return getDefaultTransitionValues(config);
}
