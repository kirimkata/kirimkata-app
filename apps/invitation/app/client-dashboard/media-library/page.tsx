'use client';

import { useState, useEffect, useRef } from 'react';

interface MediaFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: 'photo' | 'music' | 'video';
    file_size: number;
    mime_type: string;
    uploaded_at: string;
}

interface QuotaInfo {
    used: number;
    limit: number;
    remaining: number;
}

interface Quota {
    photos: QuotaInfo;
    music: QuotaInfo;
    videos: QuotaInfo;
}

type TabType = 'photo' | 'music' | 'video';

const quotaKeyMap: Record<'photo' | 'music' | 'video', 'photos' | 'music' | 'videos'> = {
    photo: 'photos',
    music: 'music',
    video: 'videos',
};

export default function MediaLibraryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('photo');
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [quota, setQuota] = useState<Quota | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchQuota();
        fetchFiles();
    }, []);

    const fetchQuota = async () => {
        try {
            const token = localStorage.getItem('client_token');
            const response = await fetch('/api/client/media/quota', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setQuota(data);
            }
        } catch (error) {
            console.error('Failed to fetch quota:', error);
        }
    };

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('client_token');
            const response = await fetch(`/api/client/media/list?type=${activeTab}`, {
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

    useEffect(() => {
        fetchFiles();
    }, [activeTab]);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Determine file type
        let fileType: 'photo' | 'music' | 'video';
        if (file.type.startsWith('image/')) fileType = 'photo';
        else if (file.type.startsWith('audio/')) fileType = 'music';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else {
            setError('Tipe file tidak didukung');
            return;
        }

        // Check quota
        if (quota) {
            const quotaKey = quotaKeyMap[fileType];
            const quotaInfo = quota[quotaKey];
            if (!quotaInfo) {
                setError('Informasi kuota tidak tersedia. Silakan muat ulang halaman.');
                return;
            }
            if (quotaInfo.remaining <= 0) {
                const typeLabel = fileType === 'photo' ? 'foto' : fileType === 'music' ? 'musik' : 'video';
                setError(`Batas maksimum upload ${typeLabel} tercapai (${quotaInfo.used}/${quotaInfo.limit}). Silakan hapus file yang tidak digunakan terlebih dahulu.`);
                return;
            }
        }

        setUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('client_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', fileType);

            const response = await fetch('/api/client/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                await fetchQuota();
                await fetchFiles();
                setError(null);
            } else {
                setError(data.message || 'Upload gagal');
            }
        } catch (error) {
            setError('Terjadi kesalahan saat upload');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (fileId: number) => {
        if (!confirm('Hapus file ini?')) return;

        try {
            const token = localStorage.getItem('client_token');
            const response = await fetch('/api/client/media/delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileId }),
            });

            if (response.ok) {
                await fetchQuota();
                await fetchFiles();
                if (previewFile?.id === fileId) {
                    setPreviewFile(null);
                }
            } else {
                const data = await response.json();
                setError(data.message || 'Gagal menghapus file');
            }
        } catch (error) {
            setError('Terjadi kesalahan saat menghapus file');
            console.error('Delete error:', error);
        }
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        alert('URL berhasil disalin!');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
            timeZoneName: 'short' // This will add timezone abbreviation
        });
        // Replace GMT+7 or other timezone names with WIB
        return formatted.replace(/GMT\+7|UTC\+7/gi, 'WIB');
    };

    const getQuotaColor = (used: number, limit: number): string => {
        const percentage = (used / limit) * 100;
        if (percentage >= 100) return '#dc2626';
        if (percentage >= 80) return '#f59e0b';
        return '#10b981';
    };

    const isUploadDisabled = (): boolean => {
        // Only disable if uploading
        if (uploading) return true;

        // If quota hasn't loaded yet, allow upload (will be validated on server)
        if (!quota) return false;

        // Check if specific tab quota is full
        const quotaKey = quotaKeyMap[activeTab];
        const quotaInfo = quotaKey ? quota[quotaKey] : undefined;

        // Safety check: if quota info doesn't exist, allow upload
        if (!quotaInfo) return false;

        return quotaInfo.remaining <= 0;
    };

    const getAcceptedFileTypes = (): string => {
        if (activeTab === 'photo') return 'image/*';
        if (activeTab === 'music') return 'audio/*';
        if (activeTab === 'video') return 'video/*';
        return 'image/*,audio/*,video/*';
    };

    const quotaItems = quota ? [
        {
            key: 'photos',
            emoji: '📸',
            title: 'Foto',
            data: quota.photos,
        },
        {
            key: 'music',
            emoji: '🎵',
            title: 'Musik',
            data: quota.music,
        },
        {
            key: 'videos',
            emoji: '🎬',
            title: 'Video',
            data: quota.videos,
        },
    ] : [];

    return (
        <>
            <div className="page-container">

                {/* Quota Display */}
                {quota && (
                    <div className="quota-section">
                        {quotaItems.map((item) => (
                            <div className="quota-item" key={item.key}>
                                <div className="quota-label">
                                    <span className="quota-emoji" aria-hidden="true">{item.emoji}</span>
                                    <span className="quota-title">{item.title}</span>
                                </div>
                                <div className="quota-bar">
                                    <div
                                        className="quota-fill"
                                        style={{
                                            width: `${(item.data.used / item.data.limit) * 100}%`,
                                            backgroundColor: getQuotaColor(item.data.used, item.data.limit)
                                        }}
                                    />
                                </div>
                                <div className="quota-text">{item.data.used}/{item.data.limit}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="error-alert">
                        <strong>⚠️ {error}</strong>
                        <button onClick={() => setError(null)} className="close-btn">✕</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'photo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photo')}
                    >
                        📸 Foto
                    </button>
                    <button
                        className={`tab ${activeTab === 'music' ? 'active' : ''}`}
                        onClick={() => setActiveTab('music')}
                    >
                        🎵 Musik
                    </button>
                    <button
                        className={`tab ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        🎬 Video
                    </button>
                </div>

                {/* Upload Button */}
                <div className="upload-section">
                    <button
                        onClick={handleFileSelect}
                        disabled={isUploadDisabled()}
                        className="upload-btn"
                        title={isUploadDisabled() && !uploading ? 'Quota penuh' : ''}
                    >
                        {uploading ? '⏳ Uploading...' : '⬆️ Upload File'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept={getAcceptedFileTypes()}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Files Grid */}
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : files.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📁</div>
                        <p>Belum ada file. Upload file pertama Anda!</p>
                    </div>
                ) : (
                    <div className="files-grid">
                        {files.map((file) => (
                            <div key={file.id} className="file-card">
                                <div className="file-preview">
                                    {file.file_type === 'photo' ? (
                                        <img src={file.file_url} alt={file.file_name} />
                                    ) : file.file_type === 'music' ? (
                                        <div className="file-icon">🎵</div>
                                    ) : (
                                        <div className="file-icon">🎬</div>
                                    )}
                                </div>
                                <div className="file-info">
                                    <div className="file-name" title={file.file_name}>{file.file_name}</div>
                                    <div className="file-meta">
                                        {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                                    </div>
                                </div>
                                <div className="file-actions">
                                    <button onClick={() => setPreviewFile(file)} className="btn-preview" title="Preview">
                                        👁️
                                    </button>
                                    <button onClick={() => copyUrl(file.file_url)} className="btn-copy" title="Copy URL">
                                        📋
                                    </button>
                                    <button onClick={() => handleDelete(file.id)} className="btn-delete" title="Hapus">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Preview Modal */}
                {previewFile && (
                    <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{previewFile.file_name}</h3>
                                <button onClick={() => setPreviewFile(null)} className="modal-close">✕</button>
                            </div>
                            <div className="modal-body">
                                {previewFile.file_type === 'photo' && (
                                    <img src={previewFile.file_url} alt={previewFile.file_name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                                )}
                                {previewFile.file_type === 'music' && (
                                    <audio controls src={previewFile.file_url} style={{ width: '100%' }} />
                                )}
                                {previewFile.file_type === 'video' && (
                                    <video controls src={previewFile.file_url} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                                )}
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => copyUrl(previewFile.file_url)} className="btn-copy-url">
                                    📋 Copy URL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-container {
                    max-width: 1200px;
                    padding: 0 0.75rem 1.25rem;
                }

                .quota-section {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    padding: 0.6rem;
                    background: white;
                    border-radius: 0.45rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .quota-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 0;
                }

                .quota-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #374151;
                    white-space: nowrap;
                }

                .quota-emoji {
                    font-size: 1rem;
                }

                .quota-title {
                    font-size: 0.78rem;
                }

                .quota-bar {
                    flex: 1;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .quota-fill {
                    height: 100%;
                    transition: all 0.3s ease;
                }

                .quota-text {
                    font-size: 0.7rem;
                    color: #6b7280;
                    white-space: nowrap;
                }

                .error-alert {
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.75rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #991b1b;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    cursor: pointer;
                    color: #991b1b;
                    padding: 0;
                    line-height: 1;
                }

                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.9rem;
                    border-bottom: 2px solid #e5e7eb;
                }

                .tab {
                    padding: 0.65rem 1.25rem;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #6b7280;
                    transition: all 0.2s;
                    font-family: 'Segoe UI', sans-serif;
                }

                .tab:hover {
                    color: #3b82f6;
                }

                .tab.active {
                    color: #3b82f6;
                    border-bottom-color: #3b82f6;
                }

                .upload-section {
                    margin-bottom: 1.1rem;
                }

                .upload-btn {
                    padding: 0.75rem 1.35rem;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
                }

                .upload-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
                    transform: translateY(-1px);
                }

                .upload-btn:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .loading, .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: #6b7280;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .files-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
                    gap: 0.85rem;
                }

                .file-card {
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    transition: all 0.2s;
                }

                .file-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                .file-preview {
                    aspect-ratio: 1;
                    background: #f3f4f6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .file-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .file-icon {
                    font-size: 2.75rem;
                }

                .file-info {
                    padding: 0.75rem;
                }

                .file-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #111827;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 0.25rem;
                }

                .file-meta {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .file-actions {
                    display: flex;
                    gap: 0.25rem;
                    padding: 0.5rem;
                    border-top: 1px solid #e5e7eb;
                }

                .file-actions button {
                    flex: 1;
                    padding: 0.5rem;
                    background: #f3f4f6;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .file-actions button:hover {
                    background: #e5e7eb;
                }

                .btn-delete:hover {
                    background: #fee2e2;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: white;
                    border-radius: 0.5rem;
                    max-width: 800px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    color: #111827;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    line-height: 1;
                }

                .modal-body {
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-footer {
                    padding: 1rem;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: flex-end;
                }

                .btn-copy-url {
                    padding: 0.5rem 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 500;
                    font-family: 'Segoe UI', sans-serif;
                }

                .btn-copy-url:hover {
                    background: #2563eb;
                }

                @media (max-width: 767px) {
                    .page-container {
                        padding: 0 0.5rem 1.25rem;
                    }

                    .quota-section {
                        gap: 0.35rem;
                        padding: 0.5rem;
                    }

                    .quota-label {
                        justify-content: center;
                    }

                    .quota-title {
                        display: none;
                    }

                    .tabs {
                        flex-wrap: wrap;
                        gap: 0.25rem;
                    }

                    .tab {
                        flex: 1;
                        text-align: center;
                    }

                    .files-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    }
                }
            `}</style>
        </>
    );
}
