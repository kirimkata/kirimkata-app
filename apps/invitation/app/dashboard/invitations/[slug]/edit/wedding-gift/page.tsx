'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { InvitationAPI } from '@/lib/api/client';

interface BankAccount {
    id?: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    display_order: number;
}

interface WeddingGiftSettings {
    title: string;
    subtitle: string;
    button_label: string;
    gift_image_url?: string;
    background_overlay_opacity: number;
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address_line1?: string;
    recipient_address_line2?: string;
    recipient_address_line3?: string;
    is_enabled: boolean;
}

export default function WeddingGiftEditorPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<WeddingGiftSettings>({
        title: 'Amplop Digital',
        subtitle: 'Doa restu Anda adalah hadiah terindah',
        button_label: 'Kirim Hadiah',
        background_overlay_opacity: 0.5,
        is_enabled: false,
    });
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const data = await InvitationAPI.getWeddingGift(slug);

            if (data.success) {
                if (data.data.settings) {
                    setSettings(data.data.settings);
                }
                if (data.data.bankAccounts) {
                    setBankAccounts(data.data.bankAccounts);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching wedding gift:', error);
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const data = await InvitationAPI.updateWeddingGift(slug, { settings, bankAccounts });
            if (data.success) {
                alert('✅ Wedding Gift saved successfully!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error: any) {
            alert('❌ Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
    }

    function addBankAccount() {
        setBankAccounts([...bankAccounts, {
            bank_name: '',
            account_number: '',
            account_holder_name: '',
            display_order: bankAccounts.length,
        }]);
    }

    function removeBankAccount(index: number) {
        setBankAccounts(bankAccounts.filter((_, i) => i !== index));
    }

    function updateBankAccount(index: number, field: keyof BankAccount, value: any) {
        const updated = [...bankAccounts];
        updated[index] = { ...updated[index], [field]: value };
        setBankAccounts(updated);
    }

    if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link href={`/dashboard/invitations/${slug}/edit`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
                            ← Back
                        </Link>
                        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                            🎁 Wedding Gift Editor
                        </h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            backgroundColor: '#8b5a3c',
                            color: 'white',
                            padding: '10px 24px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1,
                        }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Settings */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
                        Settings
                    </h2>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.is_enabled}
                                onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                                Enable Wedding Gift Section
                            </span>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Title
                            </label>
                            <input
                                type="text"
                                value={settings.title}
                                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Subtitle
                            </label>
                            <input
                                type="text"
                                value={settings.subtitle}
                                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Button Label
                            </label>
                            <input
                                type="text"
                                value={settings.button_label}
                                onChange={(e) => setSettings({ ...settings, button_label: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Accounts */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                            Bank Accounts
                        </h2>
                        <button
                            onClick={addBankAccount}
                            style={{
                                backgroundColor: '#8b5a3c',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}>
                            + Add Account
                        </button>
                    </div>

                    {bankAccounts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                            No bank accounts yet. Click "Add Account" to add one.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {bankAccounts.map((account, index) => (
                                <div key={index} style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                                            Account {index + 1}
                                        </span>
                                        <button
                                            onClick={() => removeBankAccount(index)}
                                            style={{
                                                color: '#ef4444',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                            }}>
                                            Remove
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                value={account.bank_name}
                                                onChange={(e) => updateBankAccount(index, 'bank_name', e.target.value)}
                                                placeholder="e.g., BCA, Mandiri, BNI"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                                Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={account.account_number}
                                                onChange={(e) => updateBankAccount(index, 'account_number', e.target.value)}
                                                placeholder="0001234567890"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                                Account Holder Name
                                            </label>
                                            <input
                                                type="text"
                                                value={account.account_holder_name}
                                                onChange={(e) => updateBankAccount(index, 'account_holder_name', e.target.value)}
                                                placeholder="John Doe"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Physical Gift Address */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                        Physical Gift Address (Optional)
                    </h2>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Recipient Name
                            </label>
                            <input
                                type="text"
                                value={settings.recipient_name || ''}
                                onChange={(e) => setSettings({ ...settings, recipient_name: e.target.value })}
                                placeholder="e.g., John & Jane"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={settings.recipient_phone || ''}
                                onChange={(e) => setSettings({ ...settings, recipient_phone: e.target.value })}
                                placeholder="08123456789"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Address Line 1
                            </label>
                            <input
                                type="text"
                                value={settings.recipient_address_line1 || ''}
                                onChange={(e) => setSettings({ ...settings, recipient_address_line1: e.target.value })}
                                placeholder="Street address"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Address Line 2
                            </label>
                            <input
                                type="text"
                                value={settings.recipient_address_line2 || ''}
                                onChange={(e) => setSettings({ ...settings, recipient_address_line2: e.target.value })}
                                placeholder="City, Province"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
