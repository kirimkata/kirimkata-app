'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface LoveStoryBlock {
    id?: string;
    title: string;
    body_text: string;
    display_order: number;
}

interface LoveStorySettings {
    main_title: string;
    background_image_url?: string;
    overlay_opacity: number;
    is_enabled: boolean;
}

export default function LoveStoryEditorPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<LoveStorySettings>({
        main_title: 'Cerita Cinta Kami',
        overlay_opacity: 0.3,
        is_enabled: false,
    });
    const [blocks, setBlocks] = useState<LoveStoryBlock[]>([]);

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/invitations/${slug}/love-story`);
            const data = await res.json();

            if (data.success) {
                if (data.data.settings) {
                    setSettings(data.data.settings);
                }
                if (data.data.blocks) {
                    setBlocks(data.data.blocks);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching love story:', error);
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`/api/invitations/${slug}/love-story`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings, blocks }),
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Love Story saved successfully!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error: any) {
            alert('❌ Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
    }

    function addBlock() {
        setBlocks([...blocks, {
            title: 'New Chapter',
            body_text: '',
            display_order: blocks.length,
        }]);
    }

    function removeBlock(index: number) {
        setBlocks(blocks.filter((_, i) => i !== index));
    }

    function updateBlock(index: number, field: keyof LoveStoryBlock, value: any) {
        const updated = [...blocks];
        updated[index] = { ...updated[index], [field]: value };
        setBlocks(updated);
    }

    if (loading) {
        return <div style={{ padding: '24px' }}>Loading...</div>;
    }

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
                            💕 Love Story Editor
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
                {/* Settings Card */}
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
                                Enable Love Story Section
                            </span>
                        </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={settings.main_title}
                            onChange={(e) => setSettings({ ...settings, main_title: e.target.value })}
                            placeholder="e.g., Cerita Cinta Kami"
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
                            Background Overlay Opacity: {settings.overlay_opacity}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.overlay_opacity}
                            onChange={(e) => setSettings({ ...settings, overlay_opacity: parseFloat(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Blocks */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                            Story Blocks
                        </h2>
                        <button
                            onClick={addBlock}
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
                            + Add Block
                        </button>
                    </div>

                    {blocks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                            No story blocks yet. Click "Add Block" to create your first one.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {blocks.map((block, index) => (
                                <div key={index} style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                                            Block {index + 1}
                                        </span>
                                        <button
                                            onClick={() => removeBlock(index)}
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

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={block.title}
                                            onChange={(e) => updateBlock(index, 'title', e.target.value)}
                                            placeholder="e.g., First Meet"
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
                                            Story
                                        </label>
                                        <textarea
                                            value={block.body_text}
                                            onChange={(e) => updateBlock(index, 'body_text', e.target.value)}
                                            placeholder="Tell your story..."
                                            rows={4}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
