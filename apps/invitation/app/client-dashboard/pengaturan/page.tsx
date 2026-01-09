'use client';

import { useState, useEffect } from 'react';

export default function PengaturanPage() {
    const [clientData, setClientData] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch fresh client data from server
    const fetchClientData = async () => {
        try {
            const token = localStorage.getItem('client_token');
            const response = await fetch('/api/client/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.client) {
                    // Update localStorage with fresh data
                    localStorage.setItem('client_user', JSON.stringify(data.client));
                    setClientData(data.client);
                    setFormData(prev => ({ ...prev, email: data.client.email || '' }));
                }
            }
        } catch (err) {
            console.error('Error fetching client data:', err);
        }
    };

    useEffect(() => {
        // First, load from localStorage for immediate display
        const user = localStorage.getItem('client_user');
        if (user) {
            const data = JSON.parse(user);
            setClientData(data);
            setFormData(prev => ({ ...prev, email: data.email || '' }));
        }

        // Then fetch fresh data from server
        fetchClientData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru tidak cocok' });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('client_token');
            const response = await fetch('/api/client/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: formData.email,
                    currentPassword: formData.currentPassword || undefined,
                    newPassword: formData.newPassword || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal menyimpan perubahan');
            }

            // Fetch fresh data after update
            await fetchClientData();

            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan' });
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '1rem',
                maxWidth: '600px',
            }}>
                <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                        Informasi Akun
                    </h2>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500, color: '#374151', display: 'inline-block', width: '100px' }}>Username: </span>
                        <span style={{ color: '#6b7280' }}>{clientData?.username}</span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500, color: '#374151', display: 'inline-block', width: '100px' }}>Undangan: </span>
                        <span style={{ color: clientData?.slug ? '#6b7280' : '#dc2626' }}>
                            {clientData?.slug ? `Aktif (${clientData.slug})` : 'Belum ada undangan'}
                        </span>
                    </div>
                </div>

                {message.text && (
                    <div style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem',
                        backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: message.type === 'error' ? '#991b1b' : '#166534',
                        fontSize: '0.85rem',
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                        />
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                        Ubah Password
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                        Kosongkan jika tidak ingin mengubah password.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Password Saat Ini
                        </label>
                        <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Password Baru
                        </label>
                        <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Konfirmasi Password Baru
                        </label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.65rem 1.25rem',
                            background: loading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #06b6d4)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontFamily: 'Segoe UI, sans-serif',
                        }}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
}
