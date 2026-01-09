'use client';

import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';
import { trackButtonClick } from '@/lib/services/analytics';

const footerTypography = typographyConfig.scrollable.footer;

interface FooterSectionProps {
  brideName?: string;
  groomName?: string;
  year?: number;
}

export default function FooterSection({
  brideName = 'Bride',
  groomName = 'Groom',
  year = new Date().getFullYear()
}: FooterSectionProps) {
  const whatsappNumber = '085780205096';

  const { ref: footerRef, style: footerStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 24,
  });

  return (
    <footer
      style={{
        width: '100%',
        paddingTop: 40,
        paddingBottom: 40,
        backgroundColor: '#d7d1c6',
      }}
    >
      <div
        ref={footerRef}
        style={{
          maxWidth: 900,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          // Pastikan footer selalu terlihat, sekaligus tetap pakai animasi posisi dari hook
          ...footerStyle,
          opacity: 1,
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#4f4a3f',
          }}
        >
          <div
            style={{
              color: '#4f4a3f',
              ...getTypographyStyle(footerTypography.title),
            }}
          >
            Invitation by{' '}
            <a
              href="https://kirimkata.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick('kirimkata_footer', 'https://kirimkata.com')}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 'bold',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              kirimkata
            </a>
          </div>
          <div
            style={{
              color: '#4f4a3f',
              ...getTypographyStyle(footerTypography.title),
            }}
          >
            {brideName} &amp; {groomName} • {year}
          </div>
        </div>

        {/* <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            columnGap: 24,
            borderTop: '1px solid rgba(79,74,63,0.2)',
            paddingTop: 24,
            color: '#4f4a3f',
            fontSize: 'clamp(12px, 1.7vw, 14px)',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          <a
            href="https://wa.me/6285780205096"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#4f4a3f',
              minWidth: 0,
              flex: 1,
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <FontAwesomeIcon
              icon={faWhatsapp}
              style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: '#25D366' }}
              aria-hidden="true"
            />
            <span style={{ letterSpacing: '0.03em' }}>{whatsappNumber}</span>
          </a>

          <a
            href="https://instagram.com/kirimkata"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#4f4a3f',
              minWidth: 0,
              flex: 1,
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <FontAwesomeIcon
              icon={faInstagram}
              style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}
              aria-hidden="true"
            />
            <span>@kirimkata</span>
          </a>

          <a
            href="https://kirimkata.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#4f4a3f',
              minWidth: 0,
              flex: 1,
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <FontAwesomeIcon
              icon={faGlobe}
              style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}
              aria-hidden="true"
            />
            <span>kirimkata.com</span>
          </a>
        </div> */}

        <div
          style={{
            color: '#6b655a',
            textAlign: 'center',
            ...(footerTypography.body
              ? getTypographyStyle(footerTypography.body)
              : {}),
          }}
        >
          © {year} kirimkata. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
