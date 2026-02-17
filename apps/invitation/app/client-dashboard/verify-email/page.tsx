'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const { API_ENDPOINTS } = await import('@/lib/api-config');

                const response = await fetch(API_ENDPOINTS.auth.verifyEmail, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                    return;
                }

                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            } catch (err) {
                console.error('Verification error:', err);
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            color: '#F5F5F0',
            fontFamily: 'Segoe UI, sans-serif',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center'
            }}>
                {status === 'verifying' && (
                    <>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            margin: '0 auto 1.5rem',
                            border: '3px solid rgba(255, 255, 255, 0.1)',
                            borderTopColor: '#F5F5F0',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#F5F5F0', marginBottom: '0.5rem', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
                            Verifying your email...
                        </h2>
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '300', color: '#F5F5F0', marginBottom: '1rem', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
                            Verification Successful
                        </h2>
                        <p style={{ color: 'rgba(245, 245, 240, 0.7)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}>
                            {message}
                        </p>
                        <Link href="/client-dashboard/login" style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#F5F5F0',
                            color: '#1a1a1a',
                            fontWeight: 600,
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontFamily: 'Segoe UI, sans-serif',
                            letterSpacing: '0.05em',
                            transition: 'all 0.3s',
                        }}>
                            Login Now
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '300', color: '#F5F5F0', marginBottom: '1rem', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
                            Verification Failed
                        </h2>
                        <p style={{ color: '#fca5a5', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}>
                            {message}
                        </p>
                        <Link href="/client-dashboard/login" style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'transparent',
                            color: '#F5F5F0',
                            fontWeight: 600,
                            borderRadius: '50px',
                            textDecoration: 'none',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '0.875rem',
                            fontFamily: 'Segoe UI, sans-serif',
                            letterSpacing: '0.05em',
                            transition: 'all 0.3s',
                        }}>
                            Back to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
