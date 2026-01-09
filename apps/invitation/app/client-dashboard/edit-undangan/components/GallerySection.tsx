import React, { useState } from 'react';
import { GalleryData, GalleryImage } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';
import MediaPicker from './MediaPicker';

interface GallerySectionProps {
    data: GalleryData;
    onChange: (data: GalleryData) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const handleTitleChange = (value: string) => {
        onChange({ ...data, mainTitle: value });
    };

    const handleImageChange = (index: number, field: 'src' | 'alt', value: string) => {
        const newImages = [...data.middleImages];
        newImages[index] = { ...newImages[index], [field]: value };
        onChange({ ...data, middleImages: newImages });
    };

    const addImage = () => {
        onChange({
            ...data,
            middleImages: [...data.middleImages, { src: '', alt: '' }],
        });
    };

    const removeImage = (index: number) => {
        const newImages = data.middleImages.filter((_, i) => i !== index);
        onChange({ ...data, middleImages: newImages });
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...data.middleImages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newImages.length) return;

        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
        onChange({ ...data, middleImages: newImages });
    };


    const handleMediaSelect = (files: any) => {
        // files is array of MediaFile objects
        const newImages = Array.isArray(files) ? files : [files];
        const currentCount = data.middleImages.length;
        const galleryImages: GalleryImage[] = newImages.map((file, index) => ({
            src: file.file_url,
            alt: `Foto ${currentCount + index + 1}` // Auto-generate alt text
        }));
        onChange({
            ...data,
            middleImages: [...data.middleImages, ...galleryImages]
        });
        setShowMediaPicker(false);
    };

    const handleYoutubeChange = (value: string) => {
        onChange({ ...data, youtubeEmbedUrl: value });
    };

    const toggleYoutube = () => {
        onChange({ ...data, showYoutube: !data.showYoutube });
    };

    return (
        <>
            <div className="form-row">
                <div className="form-group">
                    <label>
                        Judul Galeri
                        <Tooltip
                            id="gallery-title"
                            text="Judul section galeri (contoh: Our Moments)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.mainTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Our Moments"
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="blocks-container">
                <div className="blocks-header">
                    <h3>Foto-foto ({data.middleImages.length})</h3>
                    <button
                        type="button"
                        className="btn-library"
                        onClick={() => setShowMediaPicker(true)}
                        disabled={disabled}
                    >
                        📁 Pilih dari Library
                    </button>
                </div>

                {data.middleImages.map((image, index) => (
                    <div key={index} className="image-item">
                        <div className="image-header">
                            <span className="image-number">Foto {index + 1}</span>
                            <div className="image-actions">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => moveImage(index, 'up')}
                                        disabled={disabled}
                                        title="Pindah ke atas"
                                    >
                                        ↑
                                    </button>
                                )}
                                {index < data.middleImages.length - 1 && (
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => moveImage(index, 'down')}
                                        disabled={disabled}
                                        title="Pindah ke bawah"
                                    >
                                        ↓
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-icon btn-delete"
                                    onClick={() => {
                                        if (confirm('Hapus foto ini?')) {
                                            removeImage(index);
                                        }
                                    }}
                                    disabled={disabled}
                                    title="Hapus foto"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        {image.src && (
                            <div className="image-preview">
                                <img
                                    src={image.src}
                                    alt={`Foto ${index + 1}`}
                                    onClick={() => window.open(image.src, '_blank')}
                                    style={{ cursor: 'pointer' }}
                                    title="Klik untuk melihat ukuran penuh"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="youtube-section">
                <h3>Video YouTube (Opsional)</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={data.showYoutube}
                                onChange={toggleYoutube}
                                disabled={disabled}
                            />
                            <span style={{ marginLeft: '0.5rem' }}>Tampilkan video YouTube</span>
                        </label>
                    </div>
                </div>
                {data.showYoutube && (
                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                YouTube Embed URL
                                <Tooltip
                                    id="youtube-url"
                                    text="URL embed YouTube (contoh: https://www.youtube.com/embed/VIDEO_ID)"
                                    activeTooltip={activeTooltip}
                                    onToggle={onTooltipToggle}
                                />
                            </label>
                            <input
                                type="url"
                                value={data.youtubeEmbedUrl || ''}
                                onChange={(e) => handleYoutubeChange(e.target.value)}
                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                disabled={disabled}
                            />
                        </div>
                    </div>
                )}
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleMediaSelect}
                fileType="photo"
                multiple={true}
                selectedUrls={data.middleImages.map(img => img.src).filter(Boolean)}
            />

            <style jsx>{`
        ${editorStyles}

        .blocks-container {
          margin-top: 1rem;
        }

        .blocks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .blocks-header h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .btn-add-block {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          font-family: 'Segoe UI', sans-serif;
          font-size: 0.8125rem;
          transition: all 0.2s ease;
        }

        .btn-add-block:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
        }

        .btn-add-block:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .header-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-library {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          font-family: 'Segoe UI', sans-serif;
          font-size: 0.8125rem;
          transition: all 0.2s ease;
        }

        .btn-library:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-1px);
        }

        .btn-library:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .image-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
        }

        .image-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .image-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .image-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          opacity: 0.7;
          transition: all 0.2s;
          border-radius: 0.25rem;
        }

        .btn-icon:hover:not(:disabled) {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .btn-delete:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
        }

        .youtube-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .youtube-section h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }

        .image-preview {
          margin-top: 0.75rem;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
        }

        .image-preview img {
          width: 100%;
          height: auto;
          display: block;
          max-height: 150px;
          object-fit: contain;
          transition: opacity 0.2s ease;
        }

        .image-preview img:hover {
          opacity: 0.8;
        }
      `}</style>
        </>
    );
};
