'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { InvitationAPI } from '@/lib/api/client';

interface Settings {
    background_color: string;
    photo_url?: string;
    names_script: string;
    message_line1?: string;
    message_line2?: string;
    message_line3?: string;
    is_enabled: boolean;
}

export default function ClosingEditorPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        background_color: '#ffffff',
        names_script: '',
        is_enabled: true,
    });

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const data = await InvitationAPI.getClosing(slug);

            if (data.success && data.data) {
                setSettings(data.data.settings);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching closing:', error);
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const data = await InvitationAPI.updateClosing(slug, { settings });
            if (data.success) {
                alert('✅ Closing section saved successfully!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error: any) {
            alert('❌ Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
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
                            🎊 Closing Editor
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
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
                        Closing Section Settings
                    </h2>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.is_enabled}
                                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                                    Enable Closing Section
                                </span>
                            </label>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Couple Names (Script Style)
                            </label>
                            <input
                                type="text"
                                value={settings.names_script}
                                onChange={(e) => setSettings({ ...settings, names_script: e.target.value })}
                                placeholder="e.g., John & Jane"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                    fontFamily: 'cursive',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Message Line 1
                            </label>
                            <input
                                type="text"
                                value={settings.message_line1 || ''}
                                onChange={(e) => setSettings({ ...settings, message_line1: e.target.value })}
                                placeholder="Closing message line 1"
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
                                Message Line 2
                            </label>
                            <input
                                type="text"
                                value={settings.message_line2 || ''}
                                onChange={(e) => setSettings({ ...settings, message_line2: e.target.value })}
                                placeholder="Closing message line 2"
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
                                Message Line 3
                            </label>
                            <input
                                type="text"
                                value={settings.message_line3 || ''}
                                onChange={(e) => setSettings({ ...settings, message_line3: e.target.value })}
                                placeholder="Closing message line 3"
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
                                Background Color
                            </label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={settings.background_color}
                                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                                    style={{
                                        width: '60px',
                                        height: '40px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                    }}
                                />
                                <input
                                    type="text"
                                    value={settings.background_color}
                                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                                    placeholder="#ffffff"
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
