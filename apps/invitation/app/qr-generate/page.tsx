'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface Guest {
    id: string;
    name: string;
    phone: string;
    qr_token?: string;
}

const DUMMY_GUESTS: Guest[] = [
    { id: 'dummy-1', name: 'Budi Santoso', phone: '08123456789' },
    { id: 'dummy-2', name: 'Siti Aminah', phone: '08198765432' },
    { id: 'dummy-3', name: 'Rudi Hartono', phone: '08551234567' },
    { id: 'dummy-4', name: 'Dewi Lestari', phone: '08123344556' },
    { id: 'dummy-5', name: 'Andi Wijaya', phone: '08778899001' },
];

export default function QRGeneratePage() {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    useEffect(() => {
        // Use dummy data directly
        setGuests(DUMMY_GUESTS);
        setSelectedGuest(DUMMY_GUESTS[0]);
        setLoading(false);
    }, []);

    // Removed fetchGuests as we are using dummy data

    const handleGenerateQR = async () => {
        if (!selectedGuest) return;

        setGenerating(selectedGuest.id);

        // Mock generation for dummy data
        setTimeout(() => {
            // Create a mock token that looks somewhat real
            const mockToken = `MOCK-TOKEN-${selectedGuest.id}-${Date.now()}`;

            setGeneratedToken(mockToken);
            setGuests(prev => prev.map(g =>
                g.id === selectedGuest.id ? { ...g, qr_token: mockToken } : g
            ));
            setGenerating(null);
        }, 1000); // Simulate network delay
    };

    // Auto-select token if guest already has one
    useEffect(() => {
        if (selectedGuest?.qr_token) {
            setGeneratedToken(selectedGuest.qr_token);
        } else {
            setGeneratedToken(null);
        }
    }, [selectedGuest]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading guests...</div>;

    const containerStyle: React.CSSProperties = {
        maxWidth: '480px',
        margin: '0 auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        minHeight: '100vh',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '0.5rem'
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        marginBottom: '1rem',
        fontSize: '1rem'
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: selectedGuest && generating === null ? '#2563eb' : '#9ca3af',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: selectedGuest && generating === null ? 'pointer' : 'not-allowed',
        fontWeight: 500,
        transition: 'background-color 0.2s',
        fontSize: '1rem'
    };

    const qrCardStyle: React.CSSProperties = {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-out forwards'
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>Generate QR Code</h1>

            <div style={cardStyle}>
                <label style={labelStyle}>
                    Pilih Tamu
                </label>
                <select
                    style={selectStyle}
                    value={selectedGuest?.id || ''}
                    onChange={(e) => {
                        const guest = guests.find(g => g.id === e.target.value);
                        setSelectedGuest(guest || null);
                    }}
                >
                    {guests.map(g => (
                        <option key={g.id} value={g.id}>
                            {g.name} ({g.phone})
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleGenerateQR}
                    disabled={!selectedGuest || generating !== null}
                    style={buttonStyle}
                    onMouseOver={(e) => {
                        if (!selectedGuest || generating !== null) return;
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }}
                    onMouseOut={(e) => {
                        if (!selectedGuest || generating !== null) return;
                        e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                >
                    {generating ? 'Generating...' : 'Generate QR Code'}
                </button>
            </div>

            {generatedToken && selectedGuest && (
                <div style={qrCardStyle}>
                    <div style={{ marginBottom: '1rem' }}>
                        <QRCodeSVG
                            value={generatedToken}
                            size={200}
                            level="H"
                            includeMargin={true}
                        />
                    </div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{selectedGuest.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>{selectedGuest.phone}</p>
                    <p style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        maxWidth: '200px'
                    }}>
                        {generatedToken.substring(0, 20)}...
                    </p>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
