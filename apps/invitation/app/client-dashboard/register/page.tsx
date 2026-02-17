'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/lib/contexts/ClientContext';

export default function ClientRegisterPage() {
    const router = useRouter();
    const { login } = useClient();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const { API_ENDPOINTS } = await import('@/lib/api-config');

            const response = await fetch(API_ENDPOINTS.auth.clientRegister, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'Registration failed');
                setLoading(false);
                return;
            }

            setSuccessMessage(data.message || 'Registration successful. Please check your email.');
            setLoading(false);

            // Optional: Redirect to login after delay or show link
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    if (successMessage) {
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
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '300', color: '#F5F5F0', marginBottom: '0.5rem', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
                        Check Your Email
                    </h2>
                    <p style={{ color: 'rgba(245, 245, 240, 0.7)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}>
                        {successMessage}
                    </p>
                    <Link href="/client-dashboard/login" style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#F5F5F0',
                        color: '#1a1a1a',
                        fontWeight: 600,
                        borderRadius: '50px',
                        textDecoration: 'none',
                        transition: 'all 0.3s',
                        fontSize: '0.875rem',
                        letterSpacing: '0.05em',
                        fontFamily: 'Segoe UI, sans-serif',
                    }}>
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
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '300',
                        color: '#F5F5F0',
                        marginBottom: '0.5rem',
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.05em'
                    }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'rgba(245, 245, 240, 0.7)', fontSize: '0.875rem' }}>
                        Join KirimKata today
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'rgba(245, 245, 240, 0.9)',
                            marginBottom: '0.5rem',
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            pattern="^[a-zA-Z0-9_]{3,20}$"
                            title="3-20 characters, letters, numbers, underscore only"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#F5F5F0',
                                fontFamily: 'Segoe UI, sans-serif',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'rgba(245, 245, 240, 0.9)',
                            marginBottom: '0.5rem',
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#F5F5F0',
                                fontFamily: 'Segoe UI, sans-serif',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'rgba(245, 245, 240, 0.9)',
                            marginBottom: '0.5rem',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    paddingRight: '3rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: '#F5F5F0',
                                    fontFamily: 'Segoe UI, sans-serif',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(245, 245, 240, 0.6)',
                                }}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(245, 245, 240, 0.5)', marginTop: '0.25rem' }}>
                            Minimum 8 characters
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#fca5a5',
                            borderRadius: '0.5rem',
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
                            backgroundColor: loading ? 'rgba(245, 245, 240, 0.5)' : '#F5F5F0',
                            color: '#1a1a1a',
                            fontWeight: 600,
                            borderRadius: '50px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontFamily: 'Segoe UI, sans-serif',
                            marginBottom: '1rem',
                            transition: 'all 0.3s',
                            letterSpacing: '0.05em'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                        <span style={{ color: 'rgba(245, 245, 240, 0.7)' }}>Already have an account? </span>
                        <Link href="/client-dashboard/login" style={{
                            color: '#F5F5F0',
                            fontWeight: 500,
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(245, 245, 240, 0.3)',
                            paddingBottom: '2px'
                        }}>
                            Login here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
