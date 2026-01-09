'use client';

import { useState, useEffect } from 'react';

interface MediaFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: 'photo' | 'music' | 'video';
    file_size: number;
    mime_type: string;
    uploaded_at: string;
}

interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (files: MediaFile | MediaFile[]) => void;
    fileType: 'photo' | 'music' | 'video';
    multiple?: boolean;
    selectedUrls?: string[]; // URLs of already selected files
}

export default function MediaPicker({
    isOpen,
    onClose,
    onSelect,
    fileType,
    multiple = false,
    selectedUrls = []
}: MediaPickerProps) {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen, fileType]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('client_token');
            const response = await fetch(`/api/client/media/list?type=${fileType}`, {
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
        if (multiple) {
            // Toggle selection for multiple mode
            const isSelected = selectedFiles.some(f => f.id === file.id);
            if (isSelected) {
                setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
            } else {
                setSelectedFiles([...selectedFiles, file]);
            }
        } else {
            // Single selection mode - select and close immediately
            onSelect(file);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (multiple) {
            onSelect(selectedFiles);
        }
        onClose();
        setSelectedFiles([]);
    };

    const handleCancel = () => {
        onClose();
        setSelectedFiles([]);
    };

    const isFileSelected = (file: MediaFile) => {
        return selectedFiles.some(f => f.id === file.id) || selectedUrls.includes(file.file_url);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getTypeLabel = () => {
        if (fileType === 'photo') return '📸 Foto';
        if (fileType === 'music') return '🎵 Musik';
        return '🎬 Video';
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Pilih {getTypeLabel()} dari Library</h3>
                        <button onClick={handleCancel} className="close-btn">✕</button>
                    </div>

                    <div className="modal-body">
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : files.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <p>Belum ada {fileType === 'photo' ? 'foto' : fileType === 'music' ? 'musik' : 'video'}.</p>
                                <p className="empty-hint">Upload file di Media Library terlebih dahulu.</p>
                            </div>
                        ) : (
                            <div className="files-grid">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`file-card ${isFileSelected(file) ? 'selected' : ''}`}
                                        onClick={() => handleFileClick(file)}
                                    >
                                        <div className="file-preview">
                                            {file.file_type === 'photo' ? (
                                                <img src={file.file_url} alt={file.file_name} />
                                            ) : file.file_type === 'music' ? (
                                                <div className="file-icon">🎵</div>
                                            ) : (
                                                <div className="file-icon">🎬</div>
                                            )}
                                            {isFileSelected(file) && (
                                                <div className="selected-badge">✓</div>
                                            )}
                                        </div>
                                        <div className="file-info">
                                            <div className="file-name" title={file.file_name}>
                                                {file.file_name}
                                            </div>
                                            <div className="file-size">{formatFileSize(file.file_size)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {multiple && files.length > 0 && (
                        <div className="modal-footer">
                            <button onClick={handleCancel} className="btn-cancel">
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="btn-confirm"
                                disabled={selectedFiles.length === 0}
                            >
                                Pilih ({selectedFiles.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
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
                    z-index: 2000;
                    padding: 1rem;
                }

                .modal-container {
                    background: white;
                    border-radius: 0.75rem;
                    max-width: 900px;
                    width: 100%;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    line-height: 1;
                    transition: color 0.2s;
                }

                .close-btn:hover {
                    color: #111827;
                }

                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .loading, .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #6b7280;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-hint {
                    font-size: 0.875rem;
                    color: #9ca3af;
                    margin-top: 0.5rem;
                }

                .files-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 1rem;
                }

                .file-card {
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .file-card:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                    transform: translateY(-2px);
                }

                .file-card.selected {
                    border-color: #3b82f6;
                    background: #eff6ff;
                }

                .file-preview {
                    aspect-ratio: 1;
                    background: #f3f4f6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }

                .file-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .file-icon {
                    font-size: 3rem;
                }

                .selected-badge {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 2rem;
                    height: 2rem;
                    background: #3b82f6;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.25rem;
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

                .file-size {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-cancel, .btn-confirm {
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                }

                .btn-cancel:hover {
                    background: #e5e7eb;
                }

                .btn-confirm {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }

                .btn-confirm:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
                }

                .btn-confirm:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                @media (max-width: 767px) {
                    .files-grid {
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    }

                    .modal-container {
                        max-height: 90vh;
                    }
                }
            `}</style>
        </>
    );
}
