'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { getWeddingGiftConfig, GiftCardConfig, giftCardTemplateGroups } from '@/themes/parallax/parallax-custom1/config/weddingGiftConfig';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const weddingGiftTypography = typographyConfig.scrollable.weddingGift;

export default function WeddingGiftSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(false);

  const invitationContent = useInvitationContent();
  const fallbackConfig = getWeddingGiftConfig();

  const { title, subtitle, buttonLabel, backgroundOverlayOpacity, cards } = useMemo(() => {
    if (!invitationContent) {
      return fallbackConfig;
    }

    const base = invitationContent.weddingGift;

    const bankCards: GiftCardConfig[] = base.bankAccounts.map((account) => {
      const template = giftCardTemplateGroups.bank[account.templateId];
      if (!template) {
        // Fallback generic bank card if template is missing - use default URLs
        return {
          id: account.templateId,
          type: 'bank',
          bankName: account.templateId,
          logoSrc: 'https://media.kirimkata.com/bca.png',
          cardBgSrc: 'https://media.kirimkata.com/card-bg-1024x640.jpeg',
          chipSrc: 'https://media.kirimkata.com/chip-atm.png',
          accountNumber: account.accountNumber,
          accountName: account.accountName,
        } as GiftCardConfig;
      }

      return {
        ...template,
        id: template.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
      } as GiftCardConfig;
    });

    const physicalTemplate = giftCardTemplateGroups.physical.physical;
    const physicalGift = base.physicalGift;

    const physicalCard: GiftCardConfig = {
      ...physicalTemplate,
      id: physicalTemplate.id,
      recipientName: physicalGift.recipientName,
      phone: physicalGift.phone,
      addressLines: [...physicalGift.addressLines],
    } as GiftCardConfig;

    return {
      title: base.title,
      subtitle: base.subtitle,
      buttonLabel: base.buttonLabel,
      backgroundOverlayOpacity: base.backgroundOverlayOpacity,
      giftImageSrc: base.giftImageSrc,
      cards: [...bankCards, physicalCard],
    };
  }, [invitationContent, fallbackConfig]);

  const { ref: titleRef, style: titleStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 32,
  });

  const { ref: subtitleRef, style: subtitleStyle } = useInViewSlideIn({
    direction: 'right',
    distance: 32,
    delayMs: 100,
  });

  const { ref: buttonRef, style: buttonStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 24,
    delayMs: 200,
  });

  const handleCopy = (accountNumber: string, index: number) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendGift = () => {
    setShowCards(true);
  };

  const renderBankCard = (card: GiftCardConfig, index: number) => {
    if (card.type !== 'bank') return null;
    return (
      <div
        key={card.id}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 26,
          backgroundColor: 'rgba(255,255,255,0.95)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
          }}
        >
          <Image
            src={card.cardBgSrc}
            alt={`${card.bankName} card background`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            style={{
              objectFit: 'cover',
              opacity: 0.95,
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 48,
                height: 32,
              }}
            >
              <Image
                src={card.chipSrc}
                alt="Card chip"
                fill
                sizes="48px"
                style={{
                  objectFit: 'contain',
                }}
              />
            </div>
            <div
              style={{
                position: 'relative',
                width: 80,
                height: 40,
              }}
            >
              <Image
                src={card.logoSrc}
                alt={`${card.bankName} logo`}
                fill
                sizes="80px"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'right center',
                }}
              />
            </div>
          </div>

          <div>
            <p
              style={{
                color: '#1e2433',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.12em',
                marginBottom: 4,
              }}
            >
              {card.accountNumber}
            </p>
            <p
              style={{
                color: '#2f3442',
                fontSize: 14,
              }}
            >
              {card.accountName}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => handleCopy(card.accountNumber, index)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                backgroundColor: 'rgba(0,0,0,0.08)',
                color: '#2f3442',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copiedIndex === index ? card.copiedLabel || 'Tersalin' : card.copyLabel || 'Salin rekening'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPhysicalCard = (card: GiftCardConfig) => {
    if (card.type !== 'physical') return null;
    return (
      <div
        key={card.id}
        style={{
          borderRadius: 26,
          backgroundColor: 'rgba(255,255,255,0.95)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.3)',
          padding: '26px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          🎁
        </div>
        <div
          style={{
            color: '#1e2433',
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 8,
            ...(weddingGiftTypography.cardText
              ? getTypographyStyle(weddingGiftTypography.cardText)
              : {}),
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            color: '#2f3442',
            fontSize: 14,
            lineHeight: 1.6,
            ...(weddingGiftTypography.cardText
              ? getTypographyStyle(weddingGiftTypography.cardText)
              : {}),
          }}
        >
          <p
            style={{
              marginBottom: 4,
            }}
          >
            {card.recipientName}
          </p>
          {'phone' in card && card.phone && (
            <p
              style={{
                marginBottom: 4,
              }}
            >
              {card.phone}
            </p>
          )}
          {'addressLines' in card &&
            card.addressLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
        </div>
      </div>
    );
  };

  return (
    <section
      style={{
        width: '100%',
        paddingTop: 64,
        paddingBottom: 64,
        backgroundColor: `rgba(0,0,0,${backgroundOverlayOpacity ?? 0.55})`,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2
          ref={titleRef}
          className="text-center"
          style={{
            textAlign: 'center',
            marginBottom: 16,
            color: '#ffffff',
            ...getTypographyStyle(weddingGiftTypography.title),
            ...titleStyle,
          }}
        >
          Wedding Gift
        </h2>

        <p
          ref={subtitleRef}
          style={{
            textAlign: 'center',
            marginTop: 0,
            marginBottom: 24,
            color: 'rgba(255,255,255,0.9)',
            ...(weddingGiftTypography.subtitle
              ? getTypographyStyle(weddingGiftTypography.subtitle)
              : {}),
            ...subtitleStyle,
          }}
        >
          {subtitle}
        </p>

        <div
          ref={buttonRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginBottom: 16,
            ...buttonStyle,
          }}
        >
          <button
            type="button"
            onClick={handleSendGift}
            style={{
              padding: '12px 40px',
              borderRadius: 9999,
              backgroundColor: '#ffffff',
              color: '#4a4640',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              border: 'none',
              boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
              cursor: 'pointer',
              ...(weddingGiftTypography.giftButton
                ? getTypographyStyle(weddingGiftTypography.giftButton)
                : {}),
            }}
          >
            {buttonLabel}
          </button>
        </div>

        {showCards && (
          <div
            style={{
              width: '100%',
              marginTop: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {cards.map((card, index) => (
              <WeddingGiftCard
                key={index}
                card={card}
                index={index}
                onCopy={handleCopy}
                copiedIndex={copiedIndex}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface WeddingGiftCardProps {
  card: GiftCardConfig;
  index: number;
  onCopy: (accountNumber: string, index: number) => void;
  copiedIndex: number | null;
}

function WeddingGiftCard({ card, index, onCopy, copiedIndex }: WeddingGiftCardProps) {
  const { ref, style } = useInViewSlideIn({
    direction: index % 2 === 0 ? 'left' : 'right',
    distance: 40,
    delayMs: index * 100,
  });

  if (card.type === 'bank') {
    return (
      <div ref={ref} style={style}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.95)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
            }}
          >
            <Image
              src={card.cardBgSrc}
              alt={`${card.bankName} card background`}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              style={{
                objectFit: 'cover',
                opacity: 0.95,
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 48,
                  height: 32,
                }}
              >
                <Image
                  src={card.chipSrc}
                  alt="Card chip"
                  fill
                  sizes="48px"
                  style={{
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 80,
                  height: 40,
                }}
              >
                <Image
                  src={card.logoSrc}
                  alt={`${card.bankName} logo`}
                  fill
                  sizes="80px"
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'right center',
                  }}
                />
              </div>
            </div>

            <div>
              <p
                style={{
                  color: '#1e2433',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  marginBottom: 4,
                  ...(weddingGiftTypography.cardText
                    ? getTypographyStyle(weddingGiftTypography.cardText)
                    : {}),
                }}
              >
                {card.accountNumber}
              </p>
              <p
                style={{
                  color: '#3a4255',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 2,
                  ...(weddingGiftTypography.cardText
                    ? getTypographyStyle(weddingGiftTypography.cardText)
                    : {}),
                }}
              >
                {card.accountName}
              </p>
              <p
                style={{
                  color: '#5a6275',
                  fontSize: 12,
                  fontWeight: 400,
                  ...(weddingGiftTypography.cardText
                    ? getTypographyStyle(weddingGiftTypography.cardText)
                    : {}),
                }}
              >
                {card.bankName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCopy(card.accountNumber, index)}
              style={{
                marginTop: 4,
                padding: '10px 20px',
                borderRadius: 9999,
                backgroundColor: copiedIndex === index ? '#10b981' : '#1e2433',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                ...(weddingGiftTypography.cardButton
                  ? getTypographyStyle(weddingGiftTypography.cardButton)
                  : {}),
              }}
            >
              {copiedIndex === index ? (card.copiedLabel || 'Copied!') : (card.copyLabel || 'Copy Account Number')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={style}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 26,
          backgroundColor: 'rgba(255,255,255,0.95)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* Background gradient similar to bank card */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            opacity: 0.15,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '10px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Gift Box Icon */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 64,
                height: 64,
              }}
            >
              <Image
                src="/gift_box.png"
                alt="Gift Box"
                fill
                sizes="64px"
                style={{
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>

          {/* Title */}
          <h3
            style={{
              color: '#1e2433',
              fontSize: 24,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 0,
              ...(weddingGiftTypography.cardText
                ? getTypographyStyle(weddingGiftTypography.cardText)
                : {}),
            }}
          >
            Kirim Hadiah Fisik
          </h3>

          {/* Recipient Info */}
          {(card.recipientName || card.phone) && (
            <div
              style={{
                paddingTop: 6,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  color: '#3a4255',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 0,
                  textTransform: 'uppercase',
                  ...(weddingGiftTypography.cardText
                    ? getTypographyStyle(weddingGiftTypography.cardText)
                    : {}),
                }}
              >
                {card.recipientName && card.recipientName.toUpperCase()}
                {card.phone && ` (${card.phone})`}
              </p>
            </div>
          )}

          {/* Address */}
          <div
            style={{
              paddingTop: 6,
              textAlign: 'center',
            }}
          >
            {card.addressLines.map((line, idx) => (
              <p
                key={idx}
                style={{
                  color: '#3a4255',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: idx === card.addressLines.length - 1 ? 0 : 4,
                  ...(weddingGiftTypography.cardText
                    ? getTypographyStyle(weddingGiftTypography.cardText)
                    : {}),
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Copy Address button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => onCopy(card.addressLines.join('\n'), index)}
              style={{
                padding: '10px 20px',
                borderRadius: 9999,
                backgroundColor: copiedIndex === index ? '#10b981' : '#1e2433',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                ...(weddingGiftTypography.cardButton
                  ? getTypographyStyle(weddingGiftTypography.cardButton)
                  : {}),
              }}
            >
              {copiedIndex === index ? (card.copiedLabel || 'Copied!') : (card.copyLabel || 'Copy Address')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
