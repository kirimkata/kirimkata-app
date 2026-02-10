'use client';

import Image from 'next/image';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

interface Section15Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    brandName: string;
    footerLabel: string;
    socialLinks?: {
        instagramUrl?: string;
        facebookUrl?: string;
        whatsappUrl?: string;
    };
}

function SocialIcon({ type }: { type: 'instagram' | 'facebook' | 'whatsapp' }) {
    const common = {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
    };

    if (type === 'instagram') {
        return (
            <svg {...common} aria-hidden="true">
                <path
                    d="M7 2H17C19.7614 2 22 4.23858 22 7V17C22 19.7614 19.7614 22 17 22H7C4.23858 22 2 19.7614 2 17V7C2 4.23858 4.23858 2 7 2Z"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="1.8"
                />
                <path
                    d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="1.8"
                />
                <path
                    d="M17.5 6.5H17.51"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    if (type === 'facebook') {
        return (
            <svg {...common} aria-hidden="true">
                <path
                    d="M14 8.5V7.25C14 6.00736 15.0074 5 16.25 5H18V2H16.25C13.3505 2 11 4.3505 11 7.25V8.5H8.5V11.5H11V22H14V11.5H17.5L18 8.5H14Z"
                    fill="rgba(255,255,255,0.9)"
                />
            </svg>
        );
    }

    return (
        <svg {...common} aria-hidden="true">
            <path
                d="M20.52 3.48A11.88 11.88 0 0012.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.13 1.6 5.95L0 24l6.32-1.66a11.9 11.9 0 005.74 1.47h.01c6.56 0 11.9-5.33 11.9-11.89a11.83 11.83 0 00-3.45-8.44ZM12.07 21.33h-.01a9.86 9.86 0 01-5.03-1.38l-.36-.22-3.75.98 1-3.65-.23-.37a9.87 9.87 0 01-1.52-5.27c0-5.45 4.44-9.88 9.9-9.88a9.84 9.84 0 016.98 2.9 9.81 9.81 0 012.9 6.98c0 5.45-4.44 9.89-9.88 9.89Z"
                fill="rgba(255,255,255,0.9)"
            />
        </svg>
    );
}

export default function Section15({
    backgroundImageUrl,
    overlayOpacity = 0.62,
    title,
    description,
    brandName,
    footerLabel,
    socialLinks,
}: Section15Props) {
    const invitationContent = useInvitationContent();

    const closing = invitationContent?.closing;

    const finalBackground = closing?.photoSrc || backgroundImageUrl;
    const namesScript = closing?.namesScript || invitationContent?.profile?.coupleNames || 'Bride & Groom';
    const descriptionText = (closing?.messageLines?.length ? closing.messageLines.join('\n') : description) || '';

    return (
        <section
            style={{
                position: 'relative',
                width: '100%',
                minHeight: '100vh',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '72px 20px',
                boxSizing: 'border-box',
            }}
        >
            <FontLoader fonts={['ebGaramond', 'rasa', 'satisfy']} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Image
                    src={finalBackground}
                    alt="Closing background"
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    priority={false}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                    }}
                />
            </div>

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 520,
                    textAlign: 'center',
                    color: '#ffffff',
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: 32,
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {title}
                </h2>

                <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)', margin: '16px auto 0', maxWidth: 460 }} />

                <p
                    style={{
                        margin: '18px auto 0',
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: 14,
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.9)',
                        whiteSpace: 'pre-line',
                        maxWidth: 460,
                    }}
                >
                    {descriptionText}
                </p>

                <div
                    style={{
                        marginTop: 22,
                        fontFamily: getFontFamily('satisfy', 'cursive'),
                        fontSize: 28,
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.95)',
                    }}
                >
                    {namesScript}
                </div>

                <div style={{ marginTop: 56 }}>
                    <div
                        style={{
                            marginBottom: 16,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src="/k_logo.png"
                            alt="KirimKata"
                            style={{
                                width: 60,
                                height: 60,
                                objectFit: 'contain',
                            }}
                        />
                    </div>

                    <div
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: 40,
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            textTransform: 'lowercase',
                        }}
                    >
                        {brandName}
                    </div>

                    <div
                        style={{
                            marginTop: 6,
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: 12,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.85)',
                        }}
                    >
                        {footerLabel} © {new Date().getFullYear()}
                    </div>

                    <div
                        style={{
                            marginTop: 14,
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 18,
                        }}
                    >
                        <a
                            href={socialLinks?.instagramUrl || '#'}
                            target={socialLinks?.instagramUrl ? '_blank' : undefined}
                            rel={socialLinks?.instagramUrl ? 'noopener noreferrer' : undefined}
                            style={{
                                opacity: socialLinks?.instagramUrl ? 1 : 0.55,
                                pointerEvents: socialLinks?.instagramUrl ? 'auto' : 'none',
                            }}
                        >
                            <SocialIcon type="instagram" />
                        </a>
                        <a
                            href={socialLinks?.facebookUrl || '#'}
                            target={socialLinks?.facebookUrl ? '_blank' : undefined}
                            rel={socialLinks?.facebookUrl ? 'noopener noreferrer' : undefined}
                            style={{
                                opacity: socialLinks?.facebookUrl ? 1 : 0.55,
                                pointerEvents: socialLinks?.facebookUrl ? 'auto' : 'none',
                            }}
                        >
                            <SocialIcon type="facebook" />
                        </a>
                        <a
                            href={socialLinks?.whatsappUrl || '#'}
                            target={socialLinks?.whatsappUrl ? '_blank' : undefined}
                            rel={socialLinks?.whatsappUrl ? 'noopener noreferrer' : undefined}
                            style={{
                                opacity: socialLinks?.whatsappUrl ? 1 : 0.55,
                                pointerEvents: socialLinks?.whatsappUrl ? 'auto' : 'none',
                            }}
                        >
                            <SocialIcon type="whatsapp" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
