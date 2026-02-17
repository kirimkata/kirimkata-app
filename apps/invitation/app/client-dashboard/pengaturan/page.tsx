'use client';

import { useState, useEffect } from 'react';
import { InvitationAPI } from '@/lib/api/client';

export default function PengaturanPage() {
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local snackbar state
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => {
            setSnackbar(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Fetch client data
    useEffect(() => {
        const fetchClientData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('client_token');
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const result = await InvitationAPI.getClientProfile(token);

                if (result.success && result.client) {
                    setEmail(result.client.email || '');
                } else {
                    showSnackbar('Gagal memuat data profil', 'error');
                }
            } catch (error) {
                console.error('Error fetching client data:', error);
                showSnackbar('Terjadi kesalahan saat memuat data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClientData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password if changing
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                showSnackbar('Password baru tidak cocok', 'error');
                return;
            }
            if (!currentPassword) {
                showSnackbar('Masukkan password saat ini untuk mengubah password', 'error');
                return;
            }
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                showSnackbar('Sesi habis, silakan login kembali', 'error');
                return;
            }

            const updateData: any = { email };
            if (newPassword) {
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }

            const result = await InvitationAPI.updateClientSettings(updateData, token);

            if (result.success) {
                showSnackbar('Pengaturan berhasil disimpan');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showSnackbar(result.error || 'Gagal menyimpan pengaturan', 'error');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            showSnackbar('Terjadi kesalahan saat menyimpan pengaturan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 relative">
            {/* Snackbar */}
            {snackbar.show && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all transform ${snackbar.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                >
                    {snackbar.message}
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6 text-[#F5F5F0]">Pengaturan Akun</h1>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1.5rem',
                maxWidth: '42rem',
                backdropFilter: 'blur(10px)',
            }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Section */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-[#F5F5F0]">Email</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#F5F5F0] mb-1">
                                    Alamat Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/5 text-[#F5F5F0]"
                                    placeholder="nama@email.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Password Section */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-[#F5F5F0]">Ganti Password</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#F5F5F0] mb-1">
                                    Password Saat Ini
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/5 text-[#F5F5F0]"
                                    placeholder="Masukkan password saat ini"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Diperlukan jika ingin mengubah password
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#F5F5F0] mb-1">
                                        Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/5 text-[#F5F5F0]"
                                        placeholder="Password baru"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#F5F5F0] mb-1">
                                        Konfirmasi Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/5 text-[#F5F5F0]"
                                        placeholder="Ulangi password baru"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium ${isSaving ? 'bg-gray-600' : 'bg-blue-600'}`}
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
