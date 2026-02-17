'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api-config';
import { InvitationAPI } from '@/lib/api/client';
import { Info, Camera, Loader2, Upload, Image as ImageIcon, Check } from 'lucide-react';

interface MediaFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: 'photo' | 'music' | 'video';
    file_size: number;
    mime_type: string;
    uploaded_at: string;
}

interface CustomImages {
    background?: string;
    background_limasan?: string;
    pengantin?: string;
    pengantin_jawa?: string;
    [key: string]: string | undefined;
}

interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: MediaFile) => void;
    fileType: 'photo' | 'music' | 'video';
}

function MediaPicker({ isOpen, onClose, onSelect, fileType }: MediaPickerProps) {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen, fileType]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('client_token');
            const response = await fetch(`${API_ENDPOINTS.media.list}?type=${fileType}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file: MediaFile) => {
        onSelect(file);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '56rem', width: '100%', maxHeight: '80vh', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pilih Foto dari Library</h3>
                    <button onClick={onClose} style={{ color: '#6b7280', fontSize: '1.5rem', lineHeight: 1, border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: 'calc(80vh - 80px)' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading...</div>
                    ) : files.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>📁</div>
                            <p>Belum ada foto.</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Upload file di Media Library terlebih dahulu.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                    onClick={() => handleFileClick(file)}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <div style={{ aspectRatio: '1', position: 'relative', backgroundColor: '#f3f4f6' }}>
                                        <img src={file.file_url} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ padding: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.file_name}>
                                            {file.file_name}
                                        </div>
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

export default function CustomTemaPage() {
    const router = useRouter();
    const [customImages, setCustomImages] = useState<CustomImages>({});
    const [themeKey, setThemeKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Local snackbar state
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => {
            setSnackbar(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Current active image picker
    const [activeImageKey, setActiveImageKey] = useState<string | null>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem('client_token');
            if (!token) {
                router.push('/client-dashboard/login');
                return;
            }

            try {
                const result = await InvitationAPI.getCustomImages(token);

                if (result.success) {
                    if (result.theme_key) {
                        setThemeKey(result.theme_key);
                        if (result.custom_images) {
                            setCustomImages(result.custom_images);
                        }
                    } else {
                        // If no theme key, it means client hasn't been assigned an invitation yet
                        showSnackbar('Anda belum memiliki undangan aktif', 'error');
                    }
                } else {
                    showSnackbar(result.message || 'Gagal memuat data undangan', 'error');
                }
            } catch (error) {
                console.error('Error checking access:', error);
                showSnackbar('Terjadi kesalahan saat memuat data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [router]);

    const handleImageSelectClick = (imageKey: string) => {
        setActiveImageKey(imageKey);
        setIsMediaPickerOpen(true);
    };

    const handleFileSelect = (file: { file_url: string }) => {
        if (activeImageKey) {
            setCustomImages(prev => ({
                ...prev,
                [activeImageKey]: file.file_url
            }));
            setActiveImageKey(null);
            setIsMediaPickerOpen(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                showSnackbar('Autentikasi diperlukan', 'error');
                setIsSaving(false);
                return;
            }

            const result = await InvitationAPI.saveCustomImages(customImages, token);

            if (result.success) {
                showSnackbar('Perubahan berhasil disimpan');
            } else {
                showSnackbar(result.message || 'Gagal menyimpan perubahan', 'error');
            }
        } catch (error) {
            console.error('Error saving custom images:', error);
            showSnackbar('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveImage = (imageKey: string) => {
        setCustomImages(prev => {
            const updated = { ...prev };
            delete updated[imageKey];
            return updated;
        });
    };

    const imageLabels: Record<string, string> = {
        background: 'Background Padang',
        background_limasan: 'Background Limasan',
        pengantin: 'Foto Pengantin (Modern)',
        pengantin_jawa: 'Foto Pengantin (Jawa)',
    };

    const imageDescriptions: Record<string, string> = {
        background: 'Background utama yang muncul di section awal',
        background_limasan: 'Background yang muncul di section akhir',
        pengantin: 'Foto pengantin modern yang muncul di section 1-3',
        pengantin_jawa: 'Foto pengantin jawa yang muncul di section 4-6',
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.5rem' }}><Loader2 className="animate-spin" size={32} /></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Only block access if theme_key is explicitly set to a different theme
    // Allow access if theme_key is null (not set) or is template1
    if (themeKey && themeKey !== 'parallax/parallax-template1') {
        return <div className="p-8 text-center text-gray-500">Tema ini tidak mendukung kustomisasi gambar.</div>;
    }

    const hasAnyCustomImage = Object.values(customImages).some(img => img);

    return (
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem', position: 'relative' }}>
            {/* Snackbar */}
            {snackbar.show && (
                <div
                    style={{
                        position: 'fixed',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 50,
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'white',
                        backgroundColor: snackbar.type === 'success' ? '#16a34a' : '#dc2626',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    {snackbar.message}
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Custom Tema</h1>
                <p style={{ color: '#4b5563' }}>
                    Kustomisasi gambar untuk tema Template1. Pilih foto dari media library Anda.
                </p>
            </div>

            {!hasAnyCustomImage && (
                <div style={{ marginBottom: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem' }}><Info size={24} /></div>
                        <div>
                            <h3 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.25rem' }}>Belum ada foto custom</h3>
                            <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.5rem' }}>
                                Saat ini undangan Anda menggunakan foto default. Untuk menggunakan foto custom:
                            </p>
                            <ol style={{ fontSize: '0.875rem', color: '#1e40af', listStyleType: 'decimal', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Upload foto ke <a href="/client-dashboard/media-library" style={{ textDecoration: 'underline', fontWeight: 600 }}>Media Library</a> terlebih dahulu</li>
                                <li>Kembali ke halaman ini dan pilih foto dari library</li>
                                <li>Simpan perubahan</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.keys(imageLabels).map((imageKey) => (
                    <div key={imageKey} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{imageLabels[imageKey]}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{imageDescriptions[imageKey]}</p>
                            </div>
                        </div>

                        {customImages[imageKey] ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={customImages[imageKey]}
                                        alt={imageLabels[imageKey]}
                                        style={{ width: '100%', maxWidth: '28rem', height: '12rem', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleImageSelectClick(imageKey)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    >
                                        Ganti Foto
                                    </button>
                                    <button
                                        onClick={() => handleRemoveImage(imageKey)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={() => handleImageSelectClick(imageKey)}
                                    style={{ width: '100%', maxWidth: '28rem', height: '12rem', border: '2px dashed #d1d5db', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <div style={{ marginBottom: '0.5rem' }}><Camera size={36} /></div>
                                    <p style={{ color: '#4b5563', fontWeight: 500 }}>Pilih Foto</p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Menggunakan foto default</p>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                    onClick={() => router.push('/client-dashboard')}
                    style={{ padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                    Batal
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: isSaving ? '#9ca3af' : '#16a34a', color: 'white', borderRadius: '8px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#15803d')}
                    onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#16a34a')}
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            <MediaPicker
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleFileSelect}
                fileType="photo"
            />
        </div>
    );
}
