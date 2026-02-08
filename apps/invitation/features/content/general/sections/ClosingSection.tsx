'use client';

import Image from 'next/image';
import { getClosingConfig } from '@/config/closingConfig';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const closingTypography = typographyConfig.scrollable.closing;

export default function ClosingSection() {
  const invitationContent = useInvitationContent();
  const fallbackConfig = getClosingConfig();
  const config = invitationContent
    ? {
      backgroundColor: invitationContent.closing.backgroundColor,
      photoSrc: invitationContent.closing.photoSrc,
      photoAlt: invitationContent.closing.photoAlt,
      namesScript: invitationContent.closing.namesScript,
      messageLines: [...invitationContent.closing.messageLines],
    }
    : fallbackConfig;

  const { ref: photoRef, style: photoStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 32,
  });

  const { ref: textRef, style: textStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 32,
    delayMs: 120,
  });

  return (
    <section
      style={{
        width: '100%',
        padding: '64px 24px',
        backgroundColor: config.backgroundColor,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          textAlign: 'center',
          marginTop: 0,
        }}
      >
        {/* Polaroid wrapper */}
        <div
          ref={photoRef}
          style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: 48,
            ...photoStyle,
          }}
        >
          {/* Background script text suggestion could go here in future if needed */}

          {/* Polaroid card */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#f9f7f3',
              padding: 16,
              paddingBottom: 50,
              boxShadow: '0 24px 45px rgba(0,0,0,0.28)',
              rotate: '3deg',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 260,
                height: 320,
                overflow: 'hidden',
                backgroundColor: '#eee', // Placeholder color if no image
              }}
            >
              {config.photoSrc ? (
                <Image
                  src={config.photoSrc}
                  alt={config.photoAlt}
                  fill
                  sizes="260px"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '14px'
                  }}
                >
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Top tape */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 190,
              width: 120,
              height: 22,
              backgroundColor: '#9b8b7a',
              transform: 'rotate(-25deg)',
              opacity: 0.85,
            }}
          />

          {/* Bottom-left tape */}
          <div
            style={{
              position: 'absolute',
              bottom: -5,
              left: 200,
              width: 120,
              height: 22,
              backgroundColor: '#9b8b7a',
              transform: 'rotate(-20deg)',
              opacity: 0.85,
            }}
          />

          {/* Names script under photo */}
          <div
            style={{
              position: 'absolute',
              right: 70,
              bottom: 2,
              transform: 'rotate(3deg)',
              whiteSpace: 'nowrap',
              ...getTypographyStyle(closingTypography.title)
            }}
          >
            {config.namesScript}
          </div>
        </div>

        {/* Closing message */}
        <div
          ref={textRef}
          style={{
            maxWidth: 520,
            margin: '0 auto',
            ...textStyle,
          }}
        >
          {config.messageLines.map((line, index) => (
            <p
              key={index}
              style={{
                margin:
                  index === 0
                    ? '0 0 6px'
                    : index === config.messageLines.length - 1
                      ? '0'
                      : '0 0 6px',
                color: '#4f4a3f',
                ...(closingTypography.body
                  ? getTypographyStyle(closingTypography.body)
                  : {}),
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
