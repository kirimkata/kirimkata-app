'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { InvitationAPI } from '@/lib/api/client';
import { FormField, TextInput, Button, useToast } from '@/components/ui';
import { Save } from 'lucide-react';

export default function PengaturanPage() {
    const { colors } = useTheme();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchClientData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('client_token');
                if (!token) { setIsLoading(false); return; }
                const result = await InvitationAPI.getClientProfile(token);
                if (result.success && result.client) {
                    setEmail(result.client.email || '');
                } else {
                    showToast('error', 'Gagal memuat data profil');
                }
            } catch {
                showToast('error', 'Terjadi kesalahan saat memuat data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClientData();
    }, [showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword) {
            if (newPassword !== confirmPassword) { showToast('error', 'Password baru tidak cocok'); return; }
            if (!currentPassword) { showToast('error', 'Masukkan password saat ini untuk mengubah password'); return; }
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('client_token');
            if (!token) { showToast('error', 'Sesi habis, silakan login kembali'); return; }
            const updateData: any = { email };
            if (newPassword) { updateData.currentPassword = currentPassword; updateData.newPassword = newPassword; }
            const result = await InvitationAPI.updateClientSettings(updateData, token);
            if (result.success) {
                showToast('success', 'Pengaturan berhasil disimpan');
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                showToast('error', result.error || 'Gagal menyimpan pengaturan');
            }
        } catch {
            showToast('error', 'Terjadi kesalahan saat menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const card: React.CSSProperties = {
        backgroundColor: colors.card,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        padding: '28px',
        maxWidth: '560px',
    };

    const divider: React.CSSProperties = {
        borderTop: `1px solid ${colors.border}`,
        margin: '24px 0',
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', borderWidth: '3px', borderStyle: 'solid', borderColor: `${colors.border} ${colors.border} ${colors.border} ${colors.primary}`, animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, margin: 0 }}>Pengaturan Akun</h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '6px' }}>Kelola email dan password akun Anda</p>
            </div>

            <div style={card}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Email */}
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '16px' }}>Email</h2>
                        <FormField label="Alamat Email">
                            <TextInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                required
                            />
                        </FormField>
                    </div>

                    <div style={divider} />

                    {/* Password */}
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '16px' }}>Ganti Password</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <FormField label="Password Saat Ini" hint="Diperlukan jika ingin mengubah password">
                                <TextInput
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Masukkan password saat ini"
                                />
                            </FormField>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <FormField label="Password Baru">
                                    <TextInput
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Password baru"
                                        minLength={6}
                                    />
                                </FormField>
                                <FormField label="Konfirmasi Password">
                                    <TextInput
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password baru"
                                        minLength={6}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="primary" size="md" loading={isSaving} icon={<Save size={14} />}>
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
