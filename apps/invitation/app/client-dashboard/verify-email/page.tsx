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
            background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
            fontFamily: 'Segoe UI, sans-serif',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
            }}>
                {status === 'verifying' && (
                    <>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            margin: '0 auto 1.5rem',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#2563eb',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                            Verification Successful
                        </h2>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
                            {message}
                        </p>
                        <Link href="/client-dashboard/login" style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.375rem',
                            textDecoration: 'none',
                        }}>
                            Login Now
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                            Verification Failed
                        </h2>
                        <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>
                            {message}
                        </p>
                        <Link href="/client-dashboard/login" style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontWeight: 600,
                            borderRadius: '0.375rem',
                            textDecoration: 'none',
                            border: '1px solid #d1d5db'
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
