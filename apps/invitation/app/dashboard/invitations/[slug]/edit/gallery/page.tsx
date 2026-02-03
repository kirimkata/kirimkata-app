'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { InvitationAPI } from '@/lib/api/client';

interface GallerySettings {
    main_title: string;
    background_color: string;
    top_row_images: string[];
    middle_images: string[];
    bottom_grid_images: string[];
    youtube_url?: string;
    show_youtube: boolean;
    is_enabled: boolean;
}

export default function GalleryEditorPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GallerySettings>({
        main_title: 'Galeri Foto',
        background_color: '#f5f5f5',
        top_row_images: [],
        middle_images: [],
        bottom_grid_images: [],
        show_youtube: false,
        is_enabled: false,
    });

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const data = await InvitationAPI.getGallery(slug);

            if (data.success && data.data) {
                setSettings(data.data.settings);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching gallery:', error);
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const data = await InvitationAPI.updateGallery(slug, { settings });
            if (data.success) {
                alert('✅ Gallery saved successfully!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error: any) {
            alert('❌ Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
    }

    function addImage(section: 'top_row_images' | 'middle_images' | 'bottom_grid_images') {
        const url = prompt('Enter image URL:');
        if (url) {
            setSettings({ ...settings, [section]: [...settings[section], url] });
        }
    }

    function removeImage(section: 'top_row_images' | 'middle_images' | 'bottom_grid_images', index: number) {
        setSettings({ ...settings, [section]: settings[section].filter((_, i) => i !== index) });
    }

    function updateImage(section: 'top_row_images' | 'middle_images' | 'bottom_grid_images', index: number, url: string) {
        const updated = [...settings[section]];
        updated[index] = url;
        setSettings({ ...settings, [section]: updated });
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
                            📸 Gallery Editor
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

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.is_enabled}
                                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>
                                    Enable Gallery Section
                                </span>
                            </label>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                Section Title
                            </label>
                            <input
                                type="text"
                                value={settings.main_title}
                                onChange={(e) => setSettings({ ...settings, main_title: e.target.value })}
                                placeholder="e.g., Galeri Foto"
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
                                    placeholder="#f5f5f5"
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

                {/* Image Sections */}
                {[
                    { key: 'top_row_images', title: 'Top Row Images', description: 'Large hero images at the top' },
                    { key: 'middle_images', title: 'Middle Section Images', description: 'Featured images in the middle' },
                    { key: 'bottom_grid_images', title: 'Bottom Grid Images', description: 'Grid of smaller images' },
                ].map((section) => {
                    const sectionKey = section.key as 'top_row_images' | 'middle_images' | 'bottom_grid_images';
                    return (
                        <div key={section.key} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        {section.title}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                        {section.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => addImage(sectionKey)}
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
                                    + Add Image
                                </button>
                            </div>

                            {settings[sectionKey].length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                                    No images yet. Click "Add Image" to add one.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {settings[sectionKey].map((url, index) => (
                                        <div key={index} style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid #e5e7eb',
                                        }}>
                                            <img
                                                src={url}
                                                alt={`Image ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '150px',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                display: 'flex',
                                                gap: '4px',
                                            }}>
                                                <button
                                                    onClick={() => {
                                                        const newUrl = prompt('Enter new URL:', url);
                                                        if (newUrl) updateImage(sectionKey, index, newUrl);
                                                    }}
                                                    style={{
                                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                    }}>
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => removeImage(sectionKey, index)}
                                                    style={{
                                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        color: '#ef4444',
                                                    }}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* YouTube Video */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                        YouTube Video (Optional)
                    </h3>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.show_youtube}
                                    onChange={(e) => setSettings({ ...settings, show_youtube: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', color: '#374151' }}>
                                    Show YouTube video in gallery
                                </span>
                            </label>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                YouTube URL
                            </label>
                            <input
                                type="text"
                                value={settings.youtube_url || ''}
                                onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
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
                    </div>
                </div>
            </div>
        </div>
    );
}
