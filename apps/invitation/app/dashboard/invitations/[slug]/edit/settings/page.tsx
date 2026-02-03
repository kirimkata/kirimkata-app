'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { InvitationAPI } from '@/lib/api/client';

interface ThemeSettings {
    theme_key: string;
    enable_gallery: boolean;
    enable_love_story: boolean;
    enable_wedding_gift: boolean;
    enable_wishes: boolean;
    enable_closing: boolean;
    custom_css?: string;
}

interface MusicSettings {
    audio_url: string;
    title?: string;
    artist?: string;
    loop: boolean;
    register_as_background_audio: boolean;
    is_enabled: boolean;
}

export default function SettingsEditorPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
        theme_key: 'simple2',
        enable_gallery: false,
        enable_love_story: false,
        enable_wedding_gift: false,
        enable_wishes: true,
        enable_closing: true,
    });
    const [musicSettings, setMusicSettings] = useState<MusicSettings>({
        audio_url: '',
        loop: true,
        register_as_background_audio: true,
        is_enabled: false,
    });

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const [themeData, musicData] = await Promise.all([
                InvitationAPI.getTheme(slug),
                InvitationAPI.getMusic(slug),
            ]);

            if (themeData.success && themeData.data) {
                setThemeSettings(themeData.data.settings);
            }
            if (musicData.success && musicData.data) {
                setMusicSettings(musicData.data.settings);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const [themeData, musicData] = await Promise.all([
                InvitationAPI.updateTheme(slug, { settings: themeSettings }),
                InvitationAPI.updateMusic(slug, { settings: musicSettings }),
            ]);

            if (themeData.success && musicData.success) {
                alert('✅ Settings saved successfully!');
            } else {
                alert('❌ Error saving settings');
            }
        } catch (error: any) {
            alert('❌ Error: ' + error.message);
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
                            ⚙️ Settings
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
                {/* Feature Toggles */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
                        Feature Toggles
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                        Enable or disable sections in your invitation
                    </p>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[
                            { key: 'enable_love_story', label: 'Love Story', icon: '💕' },
                            { key: 'enable_gallery', label: 'Photo Gallery', icon: '📸' },
                            { key: 'enable_wedding_gift', label: 'Wedding Gift', icon: '🎁' },
                            { key: 'enable_wishes', label: 'Guest Wishes', icon: '💌' },
                            { key: 'enable_closing', label: 'Closing Section', icon: '🎊' },
                        ].map((feature) => (
                            <label key={feature.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <input
                                    type="checkbox"
                                    checked={themeSettings[feature.key as keyof ThemeSettings] as boolean}
                                    onChange={(e) => setThemeSettings({ ...themeSettings, [feature.key]: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                                <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                                    {feature.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Background Music */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
                        🎵 Background Music
                    </h2>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={musicSettings.is_enabled}
                                    onChange={(e) => setMusicSettings({ ...musicSettings, is_enabled: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                                    Enable Background Music
                                </span>
                            </label>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Audio URL
                            </label>
                            <input
                                type="text"
                                value={musicSettings.audio_url}
                                onChange={(e) => setMusicSettings({ ...musicSettings, audio_url: e.target.value })}
                                placeholder="https://example.com/music.mp3"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px',
                                    fontFamily: 'monospace',
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                    Song Title
                                </label>
                                <input
                                    type="text"
                                    value={musicSettings.title || ''}
                                    onChange={(e) => setMusicSettings({ ...musicSettings, title: e.target.value })}
                                    placeholder="Optional"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                    Artist
                                </label>
                                <input
                                    type="text"
                                    value={musicSettings.artist || ''}
                                    onChange={(e) => setMusicSettings({ ...musicSettings, artist: e.target.value })}
                                    placeholder="Optional"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={musicSettings.loop}
                                    onChange={(e) => setMusicSettings({ ...musicSettings, loop: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', color: '#374151' }}>
                                    Loop music
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
