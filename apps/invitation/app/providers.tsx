'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Mobile Viewport Height Fix - Prevents address bar shifting
  useEffect(() => {
    // Store the smallest viewport height (with address bar visible)
    let smallestVh = window.innerHeight;

    function setViewportHeight() {
      const currentVh = window.innerHeight;

      // Always use the smallest viewport height to ensure content is never cut off
      // This means we use the height when address bar is VISIBLE (smallest)
      if (currentVh < smallestVh) {
        smallestVh = currentVh;
      }

      const vh = smallestVh * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setViewportHeight, 100);
    };

    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(setViewportHeight, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', setViewportHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', setViewportHeight);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Only apply protection on invitation pages (not on dashboard or admin pages)
    const isDashboardPage = pathname?.startsWith('/client-dashboard') ||
      pathname?.startsWith('/admin-dashboard') ||
      pathname?.startsWith('/kirimkata-admin');

    if (isDashboardPage) {
      // Don't apply any protection on dashboard pages
      return;
    }

    // Mencegah context menu (klik kanan) - only on invitation pages
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Mencegah drag start pada gambar
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        return false;
      }
    };

    // Mencegah select start (untuk browser tertentu)
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Tambahkan event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [pathname]);

  useEffect(() => {
    const shouldHandleChunkError = (errorLike: unknown) => {
      const fromReason =
        typeof errorLike === 'object' &&
        errorLike !== null &&
        'reason' in errorLike &&
        (errorLike as PromiseRejectionEvent).reason;

      const fromErrorProp =
        typeof errorLike === 'object' &&
        errorLike !== null &&
        'error' in errorLike &&
        (errorLike as ErrorEvent).error;

      const error = (fromReason as Error | undefined) ?? (fromErrorProp as Error | undefined) ?? (errorLike as Error | undefined);

      const name = error?.name ?? '';
      const message = error?.message ?? '';

      if (
        name === 'ChunkLoadError' ||
        /ChunkLoadError/i.test(name) ||
        /Loading chunk [\w-]+ failed/i.test(message)
      ) {
        let alreadyReloaded = false;

        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            alreadyReloaded = window.sessionStorage.getItem('__chunk_error_reloaded__') === '1';
          }
        } catch {
          alreadyReloaded = false;
        }

        if (!alreadyReloaded) {
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem('__chunk_error_reloaded__', '1');
            }
          } catch { }

          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }

        return true;
      }

      return false;
    };

    const handleWindowError = (event: ErrorEvent) => {
      shouldHandleChunkError(event);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      shouldHandleChunkError(event);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleWindowError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleWindowError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);

  return <>{children}</>;
}
