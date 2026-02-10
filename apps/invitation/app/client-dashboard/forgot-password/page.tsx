'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // TODO: Implement forgot password API endpoint
            // For now, we'll use the resend verification endpoint as a placeholder
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
                setError(data.error || 'Failed to send reset email');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    if (success) {
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
                    maxWidth: '450px',
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
                        Check Your Email
                    </h2>
                    <p style={{
                        color: '#6b7280',
                        marginBottom: '1.5rem',
                        lineHeight: '1.6',
                    }}>
                        We've sent password reset instructions to <strong>{email}</strong>.
                        Please check your inbox and follow the link to reset your password.
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

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
            fontFamily: 'Segoe UI, sans-serif',
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '0.5rem',
                    }}>
                        Forgot Password?
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        No worries! Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: loading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #06b6d4)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontFamily: 'Segoe UI, sans-serif',
                            marginBottom: '1rem',
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Reset Instructions'}
                    </button>

                    <div style={{
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                    }}>
                        Remember your password?{' '}
                        <Link
                            href="/client-dashboard/login"
                            style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Login here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
