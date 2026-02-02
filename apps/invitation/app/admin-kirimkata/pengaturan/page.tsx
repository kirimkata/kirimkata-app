'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function AdminSettingsPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('admin_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Semua field harus diisi' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok' });
            return;
        }

        setLoading(true);

        try {
            // ... in handleSubmit

            // ... in handleSubmit
            const response = await fetch(API_ENDPOINTS.admin.settings, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' });
                return;
            }

            setMessage({ type: 'success', text: 'Password berhasil diubah!' });
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Pengaturan Admin</h1>
                <p>Kelola pengaturan akun admin Anda</p>
            </div>

            <div className="settings-card">
                <h2>Ubah Password</h2>
                <p className="card-description">
                    Pastikan password baru Anda aman dan mudah diingat
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="currentPassword">
                            Password Saat Ini *
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">
                            Password Baru *
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            disabled={loading}
                            autoComplete="new-password"
                            placeholder="Minimal 6 karakter"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Konfirmasi Password Baru *
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            disabled={loading}
                            autoComplete="new-password"
                            placeholder="Ulangi password baru"
                        />
                    </div>

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .settings-container {
                    max-width: 800px;
                }

                .settings-header {
                    margin-bottom: 2rem;
                }

                .settings-header h1 {
                    font-size: 1.875rem;
                    font-weight: bold;
                    color: #111827;
                    margin: 0 0 0.5rem 0;
                }

                .settings-header p {
                    color: #6b7280;
                    margin: 0;
                    font-size: 0.9375rem;
                }

                .settings-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .settings-card h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0 0 0.5rem 0;
                }

                .card-description {
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin: 0 0 2rem 0;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 0.9375rem;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }

                .form-group input:disabled {
                    background-color: #f9fafb;
                    cursor: not-allowed;
                }

                .form-group input::placeholder {
                    color: #9ca3af;
                }

                .message {
                    padding: 0.875rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                }

                .message.success {
                    background-color: #d1fae5;
                    color: #065f46;
                    border: 1px solid #6ee7b7;
                }

                .message.error {
                    background-color: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }

                .submit-btn {
                    width: 100%;
                    padding: 0.875rem 1.5rem;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 0.9375rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
                }

                .submit-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
                    transform: translateY(-1px);
                }

                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Mobile Responsive */
                @media (max-width: 767px) {
                    .settings-card {
                        padding: 1.5rem;
                    }

                    .settings-header h1 {
                        font-size: 1.5rem;
                    }

                    .settings-card h2 {
                        font-size: 1.125rem;
                    }

                    .form-group {
                        margin-bottom: 1.25rem;
                    }

                    .form-group input {
                        padding: 0.625rem;
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
}
