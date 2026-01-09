'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import type { WeddingGiftBankAccountContent } from '@/lib/repositories/invitationContentRepository';
import type {
    Simple2GiftAccountConfig,
    Simple2GiftPhysicalConfig,
    Simple2GiftRegistryItemConfig,
} from '../config/section14Config';

type GiftTab = 'e-amplop' | 'gift-registry';
type GiftView = 'main' | 'confirm';

interface Section14Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;

    title: string;
    heroImageUrl: string;
    description: string;

    tabs: {
        eAmplopLabel: string;
        giftRegistryLabel: string;
    };

    eAmplop: {
        copyLabel: string;
        copiedLabel: string;
        confirmGiftLabel: string;
        destinationPhysicalLabel: string;
        fallbackAccounts: Simple2GiftAccountConfig[];
        fallbackPhysicalGift: Simple2GiftPhysicalConfig;
    };

    confirmation: {
        title: string;
        description: string;
        namePlaceholder: string;
        giftPlaceholder: string;
        destinationPlaceholder: string;
        confirmViaWhatsappLabel: string;
        backLabel: string;
    };

    giftRegistry: {
        addressTitle: string;
        recommendationsTitle: string;
        seeAllLabel: string;
        items: Simple2GiftRegistryItemConfig[];
    };

    whatsappNumber: string;
}

function formatAccountLabel(templateId: string) {
    const trimmed = (templateId || '').trim();
    if (!trimmed) return 'BANK';
    return trimmed.toUpperCase();
}

function buildWhatsappUrl(whatsappNumber: string, message: string) {
    const number = (whatsappNumber || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${number}?text=${encoded}`;
}

export default function Section14({
    backgroundImageUrl,
    overlayOpacity = 0.62,
    title,
    heroImageUrl,
    description,
    tabs,
    eAmplop,
    confirmation,
    giftRegistry,
    whatsappNumber,
}: Section14Props) {
    const invitationContent = useInvitationContent();

    const [activeTab, setActiveTab] = useState<GiftTab>('e-amplop');
    const [view, setView] = useState<GiftView>('main');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [confirmName, setConfirmName] = useState('');
    const [confirmGift, setConfirmGift] = useState('');
    const [confirmDestinationId, setConfirmDestinationId] = useState('');

    const accountsFromDb = invitationContent?.weddingGift?.bankAccounts;
    const physicalGift = invitationContent?.weddingGift?.physicalGift;

    const eAmplopAccounts: Simple2GiftAccountConfig[] = useMemo(() => {
        if (accountsFromDb?.length) {
            return accountsFromDb.map((acc: WeddingGiftBankAccountContent, index) => ({
                id: `bank-${index}-${acc.templateId || 'bank'}`,
                label: formatAccountLabel(acc.templateId),
                accountNumber: acc.accountNumber,
                accountName: acc.accountName,
            }));
        }
        return eAmplop.fallbackAccounts;
    }, [accountsFromDb, eAmplop.fallbackAccounts]);

    const physicalDestination = useMemo(() => {
        const fallbackRecipientName = eAmplop.fallbackPhysicalGift?.recipientName || '';
        const fallbackAddressLines = eAmplop.fallbackPhysicalGift?.addressLines || [];

        const addressLines =
            physicalGift?.addressLines?.length
                ? physicalGift.addressLines
                : fallbackAddressLines;
        const recipientName = physicalGift?.recipientName || fallbackRecipientName;
        const label = eAmplop.destinationPhysicalLabel;
        const text = [recipientName, ...addressLines].filter(Boolean).join('\n');
        return {
            id: 'physical',
            label,
            recipientName,
            addressLines,
            copyText: text,
        };
    }, [
        eAmplop.destinationPhysicalLabel,
        eAmplop.fallbackPhysicalGift?.addressLines,
        eAmplop.fallbackPhysicalGift?.recipientName,
        physicalGift?.addressLines,
        physicalGift?.recipientName,
    ]);

    const destinations = useMemo(() => {
        const bankDest = eAmplopAccounts.map((acc) => ({
            id: acc.id,
            label: `${acc.label} - ${acc.accountNumber} (${acc.accountName})`,
        }));

        const physicalLabel = physicalDestination.copyText
            ? `${physicalDestination.label} - ${physicalDestination.recipientName || ''}`.trim()
            : '';

        const physicalDest = physicalLabel
            ? [{ id: physicalDestination.id, label: physicalLabel }]
            : [];

        return [...bankDest, ...physicalDest];
    }, [eAmplopAccounts, physicalDestination.copyText, physicalDestination.label, physicalDestination.recipientName]);

    const handleCopy = async (id: string, text: string) => {
        try {
            if (!navigator?.clipboard) return;
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            window.setTimeout(() => setCopiedId(null), 1500);
        } catch {
            // ignore
        }
    };

    const confirmMessage = useMemo(() => {
        const destLabel = destinations.find((d) => d.id === confirmDestinationId)?.label || '';
        return `Hai, saya ${confirmName || '[Nama]'} ingin konfirmasi pemberian angpao & kado pernikahan berupa ${
            confirmGift || '[Nominal/Kado]'
        }. Melalui _*${destLabel || '[Rekening/Alamat Tujuan]'}*_. Bisa dicek yaa.`;
    }, [confirmDestinationId, confirmGift, confirmName, destinations]);

    const confirmWaUrl = useMemo(() => buildWhatsappUrl(whatsappNumber, confirmMessage), [confirmMessage, whatsappNumber]);

    const isConfirmReady =
        confirmName.trim().length > 0 && confirmGift.trim().length > 0 && confirmDestinationId.trim().length > 0;

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
            <FontLoader fonts={['ebGaramond', 'rasa']} />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                }}
            >
                <Image
                    src={backgroundImageUrl}
                    alt="Wedding gift background"
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover', filter: 'grayscale(100%)' }}
                    priority={false}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                        zIndex: 1,
                    }}
                />
            </div>

            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: 520,
                }}
            >
                {view === 'main' ? (
                    <>
                        <h2
                            style={{
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: 32,
                                fontWeight: 500,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                margin: 0,
                                color: '#ffffff',
                            }}
                        >
                            {title}
                        </h2>

                        <div
                            style={{
                                marginTop: 18,
                                position: 'relative',
                                width: '100%',
                                height: 240,
                                overflow: 'hidden',
                            }}
                        >
                            <Image
                                src={heroImageUrl}
                                alt="Wedding gift hero"
                                fill
                                sizes="(max-width: 520px) 100vw, 520px"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>

                        <p
                            style={{
                                marginTop: 20,
                                marginBottom: 0,
                                fontFamily: getFontFamily('rasa', 'serif'),
                                fontSize: 14,
                                lineHeight: 1.75,
                                color: 'rgba(255,255,255,0.9)',
                                maxWidth: 420,
                            }}
                        >
                            {description}
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                marginTop: 22,
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: 14,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveTab('e-amplop')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: activeTab === 'e-amplop' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                    textDecoration: 'underline',
                                }}
                            >
                                {tabs.eAmplopLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('gift-registry')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: activeTab === 'gift-registry' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                    textDecoration: 'underline',
                                }}
                            >
                                {tabs.giftRegistryLabel}
                            </button>
                        </div>

                        {activeTab === 'e-amplop' ? (
                            <div style={{ marginTop: 18 }}>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.28)' }} />

                                <div style={{ paddingTop: 14 }}>
                                    {eAmplopAccounts.map((acc) => (
                                        <div key={acc.id} style={{ padding: '10px 0' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 12,
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                            fontSize: 14,
                                                            letterSpacing: '0.14em',
                                                            textTransform: 'uppercase',
                                                            color: '#ffffff',
                                                        }}
                                                    >
                                                        {acc.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: getFontFamily('rasa', 'serif'),
                                                            fontSize: 13,
                                                            color: 'rgba(255,255,255,0.9)',
                                                            marginTop: 2,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {acc.accountNumber}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: getFontFamily('rasa', 'serif'),
                                                            fontSize: 12,
                                                            color: 'rgba(255,255,255,0.85)',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {acc.accountName}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(acc.id, acc.accountNumber)}
                                                    style={{
                                                        padding: '10px 18px',
                                                        backgroundColor: 'rgba(255,255,255,0.14)',
                                                        border: '1px solid rgba(255,255,255,0.22)',
                                                        color: '#ffffff',
                                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                        fontSize: 12,
                                                        letterSpacing: '0.12em',
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {copiedId === acc.id ? eAmplop.copiedLabel : eAmplop.copyLabel}
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    height: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.28)',
                                                    marginTop: 12,
                                                }}
                                            />
                                        </div>
                                    ))}

                                    {physicalDestination.copyText ? (
                                        <div style={{ padding: '10px 0' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    justifyContent: 'space-between',
                                                    gap: 12,
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                            fontSize: 14,
                                                            letterSpacing: '0.14em',
                                                            textTransform: 'uppercase',
                                                            color: '#ffffff',
                                                        }}
                                                    >
                                                        {physicalDestination.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: getFontFamily('rasa', 'serif'),
                                                            fontSize: 12,
                                                            lineHeight: 1.6,
                                                            color: 'rgba(255,255,255,0.9)',
                                                            marginTop: 6,
                                                            whiteSpace: 'pre-wrap',
                                                        }}
                                                    >
                                                        {physicalDestination.copyText}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(physicalDestination.id, physicalDestination.copyText)}
                                                    style={{
                                                        padding: '10px 18px',
                                                        backgroundColor: 'rgba(255,255,255,0.14)',
                                                        border: '1px solid rgba(255,255,255,0.22)',
                                                        color: '#ffffff',
                                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                        fontSize: 12,
                                                        letterSpacing: '0.12em',
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {copiedId === physicalDestination.id ? eAmplop.copiedLabel : eAmplop.copyLabel}
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    height: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.28)',
                                                    marginTop: 12,
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('confirm');
                                        if (!confirmDestinationId && destinations.length) {
                                            setConfirmDestinationId(destinations[0]?.id || '');
                                        }
                                    }}
                                    style={{
                                        marginTop: 12,
                                        width: '100%',
                                        padding: '14px 18px',
                                        backgroundColor: 'rgba(255,255,255,0.14)',
                                        border: '1px solid rgba(255,255,255,0.22)',
                                        color: '#ffffff',
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 14,
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {eAmplop.confirmGiftLabel}
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginTop: 18 }}>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.28)' }} />

                                <div style={{ paddingTop: 14 }}>
                                    {physicalDestination.copyText ? (
                                        <>
                                            <div
                                                style={{
                                                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                    fontSize: 14,
                                                    letterSpacing: '0.14em',
                                                    textTransform: 'uppercase',
                                                    color: '#ffffff',
                                                }}
                                            >
                                                {giftRegistry.addressTitle}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontFamily: getFontFamily('rasa', 'serif'),
                                                    fontSize: 12,
                                                    lineHeight: 1.6,
                                                    color: 'rgba(255,255,255,0.9)',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {physicalDestination.copyText}
                                            </div>

                                            <div
                                                style={{
                                                    height: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.28)',
                                                    marginTop: 12,
                                                }}
                                            />
                                        </>
                                    ) : null}

                                    <div
                                        style={{
                                            marginTop: 14,
                                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                                            fontSize: 14,
                                            letterSpacing: '0.14em',
                                            textTransform: 'uppercase',
                                            color: '#ffffff',
                                        }}
                                    >
                                        {giftRegistry.recommendationsTitle}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 12,
                                            overflowX: 'auto',
                                            overflowY: 'hidden',
                                            WebkitOverflowScrolling: 'touch',
                                            paddingBottom: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 14,
                                                minWidth: 'max-content',
                                            }}
                                        >
                                            {giftRegistry.items.map((item) => (
                                                <GiftRegistryCard key={item.id} item={item} />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            // url intentionally empty for now
                                        }}
                                        style={{
                                            marginTop: 12,
                                            width: '100%',
                                            padding: '14px 18px',
                                            backgroundColor: 'rgba(255,255,255,0.14)',
                                            border: '1px solid rgba(255,255,255,0.22)',
                                            color: 'rgba(255,255,255,0.55)',
                                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                                            fontSize: 14,
                                            letterSpacing: '0.14em',
                                            textTransform: 'uppercase',
                                            cursor: 'not-allowed',
                                        }}
                                        disabled
                                    >
                                        {giftRegistry.seeAllLabel}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <h2
                            style={{
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: 26,
                                fontWeight: 500,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                margin: 0,
                                color: '#ffffff',
                            }}
                        >
                            {confirmation.title}
                        </h2>

                        <div
                            style={{
                                marginTop: 14,
                                height: 1,
                                backgroundColor: 'rgba(255,255,255,0.28)',
                            }}
                        />

                        <p
                            style={{
                                marginTop: 18,
                                marginBottom: 0,
                                fontFamily: getFontFamily('rasa', 'serif'),
                                fontSize: 14,
                                lineHeight: 1.75,
                                color: 'rgba(255,255,255,0.9)',
                                maxWidth: 440,
                            }}
                        >
                            {confirmation.description}
                        </p>

                        <div style={{ marginTop: 22 }}>
                            <input
                                value={confirmName}
                                onChange={(e) => setConfirmName(e.target.value)}
                                placeholder={confirmation.namePlaceholder}
                                style={inputStyle}
                            />
                            <input
                                value={confirmGift}
                                onChange={(e) => setConfirmGift(e.target.value)}
                                placeholder={confirmation.giftPlaceholder}
                                style={{ ...inputStyle, marginTop: 12 }}
                            />
                            <select
                                value={confirmDestinationId}
                                onChange={(e) => setConfirmDestinationId(e.target.value)}
                                style={{ ...inputStyle, marginTop: 12, appearance: 'auto' }}
                            >
                                <option value="" disabled>
                                    {confirmation.destinationPlaceholder}
                                </option>
                                {destinations.map((dest) => (
                                    <option key={dest.id} value={dest.id}>
                                        {dest.label}
                                    </option>
                                ))}
                            </select>

                            <a
                                href={confirmWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    marginTop: 16,
                                    width: '100%',
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(255,255,255,0.14)',
                                    border: '1px solid rgba(255,255,255,0.22)',
                                    color: isConfirmReady ? '#ffffff' : 'rgba(255,255,255,0.55)',
                                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                                    fontSize: 14,
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    pointerEvents: isConfirmReady ? 'auto' : 'none',
                                }}
                            >
                                {confirmation.confirmViaWhatsappLabel}
                            </a>

                            <button
                                type="button"
                                onClick={() => setView('main')}
                                style={{
                                    marginTop: 36,
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                                    fontSize: 14,
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    color: '#ffffff',
                                }}
                            >
                                ← {confirmation.backLabel}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 14px',
    backgroundColor: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: '#ffffff',
    fontFamily: getFontFamily('rasa', 'serif'),
    fontSize: 14,
    outline: 'none',
};

function GiftRegistryCard({ item }: { item: Simple2GiftRegistryItemConfig }) {
    return (
        <div
            style={{
                width: 220,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
            }}
        >
            <div style={{ position: 'relative', width: '100%', height: 160 }}>
                <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="220px"
                    style={{ objectFit: 'cover' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.0) 60%)',
                    }}
                />
            </div>

            <div style={{ padding: '12px 12px 14px' }}>
                <div
                    style={{
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: 16,
                        color: '#ffffff',
                        marginBottom: 6,
                    }}
                >
                    {item.title}
                </div>
                <div
                    style={{
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.88)',
                        marginBottom: 2,
                    }}
                >
                    {item.priceLabel}
                </div>
                {item.amountLabel ? (
                    <div
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.75)',
                        }}
                    >
                        {item.amountLabel}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
