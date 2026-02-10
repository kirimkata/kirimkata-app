'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Invalid verification link');
            return;
        }

        verifyEmail();
    }, [token]);

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
                if (data.code === 'TOKEN_EXPIRED') {
                    setStatus('expired');
                } else {
                    setStatus('error');
                    setError(data.error || 'Verification failed');
                }
                return;
            }

            setStatus('success');
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/client-dashboard/login');
            }, 3000);
        } catch (err) {
            console.error('Verification error:', err);
            setStatus('error');
            setError('An error occurred. Please try again.');
        }
    };

    const handleResendVerification = async () => {
        setResending(true);
        setResendSuccess(false);

        // We don't have the email from the token, so we need to ask the user
        const email = prompt('Please enter your email address:');
        if (!email) {
            setResending(false);
            return;
        }

        try {
            const { API_ENDPOINTS } = await import('@/lib/api-config');

            const response = await fetch(API_ENDPOINTS.auth.resendVerification, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'Failed to resend verification email');
                setResending(false);
                return;
            }

            setResendSuccess(true);
            setResending(false);
        } catch (err) {
            console.error('Resend error:', err);
            setError('An error occurred. Please try again.');
            setResending(false);
        }
    };

    if (status === 'verifying') {
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
                    maxWidth: '500px',
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid #2563eb',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}></div>
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '1rem',
                    }}>
                        Verifying Your Email
                    </h2>
                    <p style={{
                        color: '#6b7280',
                    }}>
                        Please wait while we verify your email address...
                    </p>
                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (status === 'success') {
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
                    maxWidth: '500px',
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '1rem',
                    }}>
                        Email Verified!
                    </h2>
                    <p style={{
                        color: '#6b7280',
                        marginBottom: '1.5rem',
                    }}>
                        Your email has been successfully verified. You can now login to your account.
                    </p>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                    }}>
                        Redirecting to login page...
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
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
                    maxWidth: '500px',
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '50%',
                        backgroundColor: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '1rem',
                    }}>
                        Verification Link Expired
                    </h2>
                    <p style={{
                        color: '#6b7280',
                        marginBottom: '1.5rem',
                    }}>
                        This verification link has expired. Please request a new verification email.
                    </p>

                    {resendSuccess && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                        }}>
                            Verification email sent! Please check your inbox.
                        </div>
                    )}

                    <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: resending ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #06b6d4)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: resending ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontFamily: 'Segoe UI, sans-serif',
                            marginBottom: '1rem',
                        }}
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>

                    <Link
                        href="/client-dashboard/login"
                        style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Error state
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
                maxWidth: '500px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '1rem',
                }}>
                    Verification Failed
                </h2>
                <p style={{
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                }}>
                    {error || 'Unable to verify your email. The link may be invalid or expired.'}
                </p>
                <Link
                    href="/client-dashboard/login"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                    }}
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
            }}>
                <div>Loading...</div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
