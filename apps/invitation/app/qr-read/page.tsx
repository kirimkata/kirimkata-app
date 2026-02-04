'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function QRReadPage() {
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const handleScan = async (text: string) => {
        if (!text || processing || text === lastScanned) return;

        setLastScanned(text);
        setProcessing(true);

        // Play beep sound (optional)
        const audio = new Audio('/beep.mp3');
        // audio.play().catch(() => {}); 

        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                setScanResult({ success: false, message: 'Unauthorized: Please login first' });
                setIsScanning(false);
                return;
            }

            const response = await fetch(API_ENDPOINTS.guestbook.checkinQr, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    qr_token: text,
                    actual_companions: 0
                })
            });

            const data = await response.json();

            if (response.ok) {
                setScanResult({
                    success: true,
                    message: `Selamat datang, ${data.data.guest_name}!`,
                    data: data.data
                });
            } else {
                setScanResult({
                    success: false,
                    message: data.error || 'Gagal check-in'
                });
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanResult({ success: false, message: 'Terjadi kesalahan sistem' });
        } finally {
            setProcessing(false);
            setIsScanning(false);
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setLastScanned(null);
        setIsScanning(true);
    };

    // --- Inline Styles (Registration Theme) ---
    // Colors:
    // Primary Text: #5d4e3a
    // Secondary/Accent: #8B7355
    // Background: #f5f0e8 -> #faf8f4

    const pageStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#f5f0e8', // Fallback
        fontFamily: "'Segoe UI', sans-serif",
        color: '#5d4e3a',
        overflow: 'hidden'
    };

    // Full screen camera container
    const cameraContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        objectFit: 'cover'
    };

    // White Overlay Mask (Elegant feel)
    const overlayMaskStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: isScanning ? 'flex' : 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(245, 240, 232, 0.85)', // Matches theme bg but transparent
        backdropFilter: 'blur(8px)'
    };

    // Cutout simulation: We can't do a real cutout with just styles easily on a div that covers screen.
    // Instead we use a "frame" that sits on top, and the overlay is actually 4 divs around it or just a frame with clear center?
    // Actually, simple border-box with massive borders is the classic CSS trick.
    const scannerFrameWrapper: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const scannerFrameStyle: React.CSSProperties = {
        width: '280px',
        height: '280px',
        position: 'relative',
        boxShadow: '0 0 0 9999px rgba(245, 240, 232, 0.9)', // White-ish overlay
        borderRadius: '24px',
        zIndex: 11
    };

    // Corner brackets (Gold theme)
    const bracketSize = '40px';
    const bracketThickness = '4px';
    const bracketColor = '#8B7355'; // Gold/Brown

    const bracketStyle = (pos: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: bracketSize,
            height: bracketSize,
            border: `${bracketThickness} solid ${bracketColor}`,
            zIndex: 12,
            opacity: 0.9,
            filter: 'drop-shadow(0 2px 4px rgba(139, 115, 85, 0.3))'
        };
        if (pos === 'tl') return { ...base, top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderRadius: '24px 0 0 0' };
        if (pos === 'tr') return { ...base, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 24px 0 0' };
        if (pos === 'bl') return { ...base, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 24px' };
        return { ...base, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 24px 0' };
    };

    // Laser scanning animation (Gold)
    const laserStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #8B7355, transparent)',
        boxShadow: '0 0 10px #8B7355',
        animation: 'scan 2.5s ease-in-out infinite',
        zIndex: 11
    };

    // Processing indicator
    const processingStyle: React.CSSProperties = {
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        display: processing ? 'block' : 'none',
        color: '#5d4e3a',
        fontSize: '1.1rem',
        fontWeight: 500,
        fontFamily: 'Georgia, serif',
        background: 'rgba(255,255,255,0.9)',
        padding: '0.5rem 1.5rem',
        borderRadius: '99px',
        boxShadow: '0 4px 12px rgba(139, 115, 85, 0.15)'
    };

    // Bottom Sheet for Results
    const resultDrawerStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        padding: '2.5rem 2rem',
        transform: scanResult ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 30,
        boxShadow: '0 -10px 40px rgba(93, 78, 58, 0.1)',
        color: '#5d4e3a',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    };

    const iconCircleStyle: React.CSSProperties = {
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '0.5rem',
        background: scanResult?.success ? 'rgba(34, 139, 34, 0.1)' : 'rgba(220, 38, 38, 0.1)',
        color: scanResult?.success ? '#228B22' : '#DC2626',
        border: `1px solid ${scanResult?.success ? 'rgba(34, 139, 34, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        backgroundColor: '#8B7355',
        color: '#F5F5F0',
        marginTop: '1.5rem',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(139, 115, 85, 0.25)',
        fontFamily: 'Segoe UI, sans-serif',
        letterSpacing: '0.05em'
    };

    // Header/Title inside overlay
    const headerElementStyle: React.CSSProperties = {
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        zIndex: 20,
        textAlign: 'center',
        padding: '0 20px'
    };

    return (
        <div style={pageStyle}>
            {/* 1. Camera Layer */}
            <div style={cameraContainerStyle}>
                <Scanner
                    onScan={(result) => {
                        if (result && result.length > 0) {
                            handleScan(result[0].rawValue);
                        }
                    }}
                    components={{ finder: false }}
                    styles={{
                        container: { width: '100%', height: '100%', objectFit: 'cover' },
                        video: { width: '100%', height: '100%', objectFit: 'cover' }
                    }}
                />
            </div>

            {/* 2. White Elegant Overlay */}
            {isScanning && (
                <>
                    {/* Frame Wrapper to do the cutout effect properly with CSS */}
                    <div style={scannerFrameWrapper}>
                        <div style={scannerFrameStyle}>
                            <div style={bracketStyle('tl')} />
                            <div style={bracketStyle('tr')} />
                            <div style={bracketStyle('bl')} />
                            <div style={bracketStyle('br')} />
                            <div style={laserStyle} />
                        </div>
                    </div>

                    <div style={headerElementStyle}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 400,
                            color: '#5d4e3a',
                            fontFamily: 'Georgia, serif'
                        }}>
                            Scan QR Tamu
                        </h1>
                        <p style={{
                            marginTop: '8px',
                            fontSize: '14px',
                            color: '#8B7355',
                            opacity: 0.9
                        }}>
                            Arahkan kamera ke kode QR undangan
                        </p>
                    </div>
                </>
            )}

            {/* 3. Processing State */}
            {processing && (
                <div style={processingStyle}>
                    Memproses...
                </div>
            )}

            {/* 4. Result Drawer */}
            <div style={resultDrawerStyle}>
                {scanResult && (
                    <>
                        <div style={{ width: '40px', height: '4px', background: '#ccc', borderRadius: '10px', marginBottom: '10px', opacity: 0.5 }} />

                        <div style={iconCircleStyle}>
                            {scanResult.success ? '✓' : '✕'}
                        </div>

                        <div>
                            <h2 style={{
                                margin: '0 0 8px',
                                fontSize: '22px',
                                fontWeight: 400,
                                color: '#5d4e3a',
                                fontFamily: 'Georgia, serif'
                            }}>
                                {scanResult.success ? 'Berhasil Check-in' : 'Gagal Check-in'}
                            </h2>
                            <p style={{ margin: 0, fontSize: '15px', color: '#8B7355', lineHeight: 1.5 }}>
                                {scanResult.message}
                            </p>

                            {scanResult.success && scanResult.data && (
                                <div style={{
                                    marginTop: '24px',
                                    padding: '20px',
                                    background: '#faf8f4',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(139, 115, 85, 0.1)',
                                    fontSize: '14px',
                                    textAlign: 'left',
                                    width: '100%',
                                    boxShadow: 'inset 0 2px 4px rgba(139, 115, 85, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(139, 115, 85, 0.1)', paddingBottom: '8px' }}>
                                        <span style={{ color: '#8B7355' }}>Nama Tamu</span>
                                        <span style={{ fontWeight: 600, color: '#5d4e3a' }}>{scanResult.data.guest_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#8B7355' }}>Jumlah Pax</span>
                                        <span style={{ fontWeight: 600, color: '#5d4e3a' }}>{scanResult.data.max_companions || 1} Orang</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={resetScan}
                            style={buttonStyle}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d5b44'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B7355'}
                        >
                            Scan Tamu Berikutnya
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
