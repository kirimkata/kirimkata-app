'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface QuotaEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        id: string;
        username: string;
        quota_photos?: number;
        quota_music?: number;
        quota_videos?: number;
    } | null;
    onSuccess: () => void;
}

export default function QuotaEditModal({ isOpen, onClose, client, onSuccess }: QuotaEditModalProps) {
    const [quotas, setQuotas] = useState({
        photos: client?.quota_photos || 10,
        music: client?.quota_music || 1,
        videos: client?.quota_videos || 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('admin_token');
            // ... inside the component

            // ... inside the component
            const response = await fetch(`${API_ENDPOINTS.admin.clients}/${client.id}/quota`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    quota_photos: quotas.photos,
                    quota_music: quotas.music,
                    quota_videos: quotas.videos,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to update quota');
                return;
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Quota - {client.username}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            📸 Photos Quota
                            <span className="hint">Maximum number of photos client can upload</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={quotas.photos}
                            onChange={(e) => setQuotas({ ...quotas, photos: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            🎵 Music Quota
                            <span className="hint">Maximum number of music files client can upload</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={quotas.music}
                            onChange={(e) => setQuotas({ ...quotas, music: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            🎬 Videos Quota
                            <span className="hint">Maximum number of videos client can upload</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={quotas.videos}
                            onChange={(e) => setQuotas({ ...quotas, videos: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
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
                    padding: 2rem;
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                h2 {
                    margin: 0 0 1.5rem 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #111827;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .hint {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 400;
                    color: #6b7280;
                    margin-top: 0.25rem;
                }

                input[type="number"] {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 1rem;
                }

                input[type="number"]:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .error-message {
                    padding: 0.75rem;
                    background: #fee2e2;
                    color: #991b1b;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 2rem;
                }

                .btn-cancel,
                .btn-submit {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    transition: all 0.2s;
                }

                .btn-cancel {
                    background: #e5e7eb;
                    color: #374151;
                }

                .btn-cancel:hover:not(:disabled) {
                    background: #d1d5db;
                }

                .btn-submit {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }

                .btn-submit:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
                }

                .btn-cancel:disabled,
                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @media (max-width: 767px) {
                    .modal-container {
                        padding: 1.5rem;
                    }

                    h2 {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
}
