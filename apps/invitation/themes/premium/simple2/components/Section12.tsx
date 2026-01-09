'use client';

import { useMemo, useState } from 'react';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';
import { createWish, type AttendanceStatus } from '@/lib/repositories/wishesRepository';

interface Section12Labels {
    nameLabel: string;
    messageLabel: string;
    attendanceLabel: string;
    hadirLabel: string;
    tidakHadirLabel: string;
    nextLabel: string;
    prevLabel: string;
    submitLabel: string;
}

interface Section12Props {
    invitationSlug: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    labels: Section12Labels;
}

type Step = 1 | 2;

export default function Section12({
    invitationSlug,
    backgroundImageUrl,
    overlayOpacity = 0.62,
    title,
    description,
    labels,
}: Section12Props) {
    const [step, setStep] = useState<Step>(1);

    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [attendance, setAttendance] = useState<AttendanceStatus | ''>('');

    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const canGoNext = useMemo(() => {
        return Boolean(name.trim());
    }, [name]);

    const canSubmit = useMemo(() => {
        return Boolean(name.trim() && attendance);
    }, [name, attendance]);

    const handleNext = () => {
        if (!canGoNext) return;
        setStep(2);
    };

    const handlePrev = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            setSubmitting(true);
            setSent(false);

            await createWish({
                invitationSlug,
                name: name.trim(),
                message: (message || '').trim(),
                attendance: attendance as AttendanceStatus,
                guestCount: 1,
            });

            setSent(true);
            setName('');
            setMessage('');
            setAttendance('');
            setStep(1);
        } catch (error) {
            console.error('Failed to submit RSVP', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section
            style={{
                position: 'relative',
                width: '100%',
                height: 'calc(var(--vh, 1vh) * 100)',
                overflow: 'hidden',
            }}
        >
            <FontLoader fonts={['ebGaramond', 'rasa']} />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'grayscale(1) contrast(1.05)',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        padding: '64px 24px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        color: '#ffffff',
                    }}
                >
                    <h2
                        style={{
                            textAlign: 'center',
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '34px',
                            fontWeight: 400,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            textAlign: 'center',
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.75,
                            color: 'rgba(255,255,255,0.92)',
                            margin: '12px auto 0',
                            maxWidth: '420px',
                        }}
                    >
                        {description}
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 14,
                            marginTop: 26,
                            marginBottom: 18,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9999,
                                backgroundColor: step === 1 ? '#ffffff' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.65)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: step === 1 ? '#000000' : 'rgba(255,255,255,0.85)',
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: 14,
                            }}
                        >
                            1
                        </div>
                        <div style={{ width: 72, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9999,
                                backgroundColor: step === 2 ? '#ffffff' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.65)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: step === 2 ? '#000000' : 'rgba(255,255,255,0.85)',
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: 14,
                            }}
                        >
                            2
                        </div>
                    </div>

                    {step === 1 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        letterSpacing: '0.06em',
                                        marginBottom: 8,
                                        display: 'block',
                                    }}
                                >
                                    {labels.nameLabel}
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    style={{
                                        width: '100%',
                                        height: 44,
                                        borderRadius: 0,
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        backgroundColor: 'rgba(0,0,0,0.18)',
                                        color: '#ffffff',
                                        padding: '0 12px',
                                        outline: 'none',
                                        fontFamily: getFontFamily('rasa', 'serif'),
                                        fontSize: 14,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        letterSpacing: '0.06em',
                                        marginBottom: 8,
                                        display: 'block',
                                    }}
                                >
                                    {labels.messageLabel}
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    style={{
                                        width: '100%',
                                        borderRadius: 0,
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        backgroundColor: 'rgba(0,0,0,0.18)',
                                        color: '#ffffff',
                                        padding: '12px',
                                        outline: 'none',
                                        resize: 'none',
                                        fontFamily: getFontFamily('rasa', 'serif'),
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                    }}
                                />
                            </div>

                            {sent ? (
                                <p
                                    style={{
                                        textAlign: 'center',
                                        margin: '8px 0 0',
                                        fontFamily: getFontFamily('rasa', 'serif'),
                                        fontSize: 14,
                                        color: 'rgba(255,255,255,0.9)',
                                    }}
                                >
                                    Terima kasih, RSVP kamu sudah terkirim.
                                </p>
                            ) : null}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canGoNext}
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 14,
                                        fontWeight: 400,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '3px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: !canGoNext ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.95)',
                                        cursor: !canGoNext ? 'not-allowed' : 'pointer',
                                        padding: '10px 0',
                                    }}
                                >
                                    {labels.nextLabel}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <p
                                style={{
                                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                                    fontSize: '16px',
                                    fontWeight: 400,
                                    letterSpacing: '0.06em',
                                    margin: '0 0 4px 0',
                                }}
                            >
                                {labels.attendanceLabel}
                            </p>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    border: '1px solid rgba(255,255,255,0.35)',
                                    backgroundColor: 'rgba(0,0,0,0.18)',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setAttendance('hadir')}
                                    style={{
                                        height: 48,
                                        border: 'none',
                                        background: attendance === 'hadir' ? 'rgba(255,255,255,0.22)' : 'transparent',
                                        color: '#ffffff',
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 16,
                                        letterSpacing: '0.06em',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {labels.hadirLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAttendance('tidak-hadir')}
                                    style={{
                                        height: 48,
                                        border: 'none',
                                        borderLeft: '1px solid rgba(255,255,255,0.35)',
                                        background: attendance === 'tidak-hadir' ? 'rgba(255,255,255,0.22)' : 'transparent',
                                        color: '#ffffff',
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 16,
                                        letterSpacing: '0.06em',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {labels.tidakHadirLabel}
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 14,
                                        fontWeight: 400,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '3px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'rgba(255,255,255,0.95)',
                                        cursor: 'pointer',
                                        padding: '10px 0',
                                    }}
                                >
                                    {labels.prevLabel}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: 14,
                                        fontWeight: 400,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '3px',
                                        border: 'none',
                                        background: 'transparent',
                                        color:
                                            !canSubmit || submitting
                                                ? 'rgba(255,255,255,0.4)'
                                                : 'rgba(255,255,255,0.95)',
                                        cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
                                        padding: '10px 0',
                                    }}
                                >
                                    {submitting ? '...' : labels.submitLabel}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
