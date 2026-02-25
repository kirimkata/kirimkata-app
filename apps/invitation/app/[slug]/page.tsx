'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { FullInvitationContent } from '@/lib/repositories/invitationContentRepository';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { InvitationLoading } from '@/components/InvitationLoading';
import { API_ENDPOINTS } from '@/lib/api-config';

type ErrorType = 'not_found' | 'inactive' | 'expired' | 'server_error' | null;

export default function InvitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const guestName = searchParams?.get('to')?.trim() || '';

  const [invitationData, setInvitationData] = useState<FullInvitationContent | null>(null);
  const [clientDef, setClientDef] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoading(true);
        setErrorType(null);

        // Try new public endpoint first
        const publicUrl = API_ENDPOINTS.public.invitation(slug);
        const response = await fetch(publicUrl);

        if (!response.ok) {
          if (response.status === 404) {
            setErrorType('not_found');
            return;
          }
          if (response.status === 403) {
            // Try to determine if inactive or expired
            const body = await response.json().catch(() => ({}));
            const msg = body?.error?.toLowerCase() || '';
            if (msg.includes('expir') || msg.includes('kadaluarsa')) {
              setErrorType('expired');
            } else {
              setErrorType('inactive');
            }
            return;
          }
          // Fallback to compile endpoint for backward compatibility
          const fallbackUrl = API_ENDPOINTS.invitations.compile(slug);
          const fallbackResponse = await fetch(fallbackUrl);
          if (!fallbackResponse.ok) {
            setErrorType('server_error');
            return;
          }
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success && fallbackResult.data) {
            setInvitationData(fallbackResult.data);
            setClientDef({
              profile: fallbackResult.data.profile,
              theme: { key: fallbackResult.data.profile.theme, dataId: slug },
            });
          } else {
            setErrorType('server_error');
          }
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data;
          setInvitationData(data);

          // Calculate days until expiry
          if (data.activeUntil) {
            const expiry = new Date(data.activeUntil);
            const now = new Date();
            const diffMs = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            setDaysUntilExpiry(diffDays > 0 ? diffDays : 0);
          }

          setClientDef({
            profile: data.profile,
            theme: { key: data.profile?.theme, dataId: slug },
          });
        } else {
          // Fallback to compile endpoint
          const fallbackUrl = API_ENDPOINTS.invitations.compile(slug);
          const fallbackResponse = await fetch(fallbackUrl);
          if (!fallbackResponse.ok) {
            setErrorType('server_error');
            return;
          }
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success && fallbackResult.data) {
            setInvitationData(fallbackResult.data);
            setClientDef({
              profile: fallbackResult.data.profile,
              theme: { key: fallbackResult.data.profile.theme, dataId: slug },
            });
          } else {
            setErrorType('server_error');
          }
        }
      } catch (err) {
        console.error('Failed to load invitation:', err);
        // Last resort: try compile endpoint
        try {
          const fallbackUrl = API_ENDPOINTS.invitations.compile(slug);
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult.success && fallbackResult.data) {
              setInvitationData(fallbackResult.data);
              setClientDef({
                profile: fallbackResult.data.profile,
                theme: { key: fallbackResult.data.profile.theme, dataId: slug },
              });
              return;
            }
          }
        } catch { }
        setErrorType('server_error');
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [slug]);

  if (loading) {
    return <InvitationLoading />;
  }

  // Error states
  if (errorType === 'not_found') {
    return <InvitationNotFound slug={slug} />;
  }

  if (errorType === 'expired') {
    return <InvitationExpired />;
  }

  if (errorType === 'inactive') {
    return <InvitationInactive />;
  }

  if (errorType === 'server_error' || !invitationData || !clientDef) {
    return <InvitationError />;
  }

  // Format theme key to match registry (e.g., "parallax-custom1" -> "parallax/parallax-custom1")
  let themeKey = clientDef.theme.key as string;
  if (themeKey && !themeKey.includes('/') && themeKey.startsWith('parallax-')) {
    themeKey = `parallax/${themeKey}`;
  } else if (themeKey && !themeKey.includes('/') && themeKey.startsWith('simple')) {
    themeKey = `premium/${themeKey}`;
  }

  const theme = resolveTheme(themeKey as any);
  const ThemeRenderer = theme?.render;

  if (!ThemeRenderer) {
    return <InvitationError />;
  }

  return (
    <div data-page="invitation">
      {/* Expiration Notice Banner */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
        <ExpirationBanner daysLeft={daysUntilExpiry} />
      )}

      <ThemeRenderer
        clientSlug={slug}
        guestName={guestName}
        fullInvitationContent={invitationData}
      />
    </div>
  );
}

// ─── Error Components ────────────────────────────────────────────────────────

function InvitationNotFound({ slug }: { slug: string }) {
  return (
    <div style={styles.errorPage}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>🔍</div>
        <h1 style={styles.errorTitle}>Undangan Tidak Ditemukan</h1>
        <p style={styles.errorMessage}>
          Maaf, undangan dengan URL <strong>/{slug}</strong> tidak ditemukan.
        </p>
        <p style={styles.errorHint}>
          Pastikan URL yang Anda masukkan sudah benar, atau hubungi penyelenggara acara.
        </p>
      </div>
    </div>
  );
}

function InvitationExpired() {
  return (
    <div style={styles.errorPage}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>⏰</div>
        <h1 style={styles.errorTitle}>Undangan Telah Berakhir</h1>
        <p style={styles.errorMessage}>
          Masa aktif undangan ini sudah berakhir.
        </p>
        <p style={styles.errorHint}>
          Silakan hubungi penyelenggara acara untuk informasi lebih lanjut.
        </p>
      </div>
    </div>
  );
}

function InvitationInactive() {
  return (
    <div style={styles.errorPage}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>🔒</div>
        <h1 style={styles.errorTitle}>Undangan Tidak Aktif</h1>
        <p style={styles.errorMessage}>
          Undangan ini saat ini tidak aktif.
        </p>
        <p style={styles.errorHint}>
          Silakan hubungi penyelenggara acara untuk informasi lebih lanjut.
        </p>
      </div>
    </div>
  );
}

function InvitationError() {
  return (
    <div style={styles.errorPage}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>⚠️</div>
        <h1 style={styles.errorTitle}>Terjadi Kesalahan</h1>
        <p style={styles.errorMessage}>
          Gagal memuat undangan. Silakan coba lagi beberapa saat.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={styles.retryButton}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

function ExpirationBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div style={styles.expirationBanner}>
      <span>⚠️</span>
      <span>
        {daysLeft === 1
          ? 'Undangan ini akan berakhir hari ini!'
          : `Undangan ini akan berakhir dalam ${daysLeft} hari.`}
      </span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  errorPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '2rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  errorCard: {
    background: 'white',
    borderRadius: '1rem',
    padding: '3rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    lineHeight: 1,
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '1rem',
  },
  errorMessage: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
    lineHeight: 1.6,
  },
  errorHint: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    lineHeight: 1.6,
  },
  retryButton: {
    marginTop: '1.5rem',
    padding: '0.75rem 2rem',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  expirationBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: '#f59e0b',
    color: 'white',
    padding: '0.625rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif",
  },
};
