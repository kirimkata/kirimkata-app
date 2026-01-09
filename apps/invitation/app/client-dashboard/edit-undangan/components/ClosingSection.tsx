import React, { useState } from 'react';
import { ClosingData } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';
import MediaPicker from './MediaPicker';

interface ClosingSectionProps {
    data: ClosingData;
    onChange: (data: ClosingData) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const ClosingSection: React.FC<ClosingSectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const handleChange = (field: keyof ClosingData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const handleMediaSelect = (file: any) => {
        handleChange('photoSrc', file.file_url);
        setShowMediaPicker(false);
    };

    return (
        <>
            <div className="form-row">
                <div className="form-group">
                    <label>
                        URL Foto Penutup
                        <Tooltip
                            id="closing-photo"
                            text="URL foto untuk section penutup"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <div className="input-with-button">
                        <input
                            type="url"
                            value={data.photoSrc}
                            onChange={(e) => handleChange('photoSrc', e.target.value)}
                            placeholder="https://media.kirimkata.com/foto.jpeg"
                            disabled={disabled}
                        />
                        <button
                            type="button"
                            onClick={() => setShowMediaPicker(true)}
                            className="btn-library"
                            disabled={disabled}
                        >
                            📁 Pilih dari Library
                        </button>
                    </div>
                    {data.photoSrc && (
                        <div className="image-preview">
                            <img src={data.photoSrc} alt="Preview" style={{ maxWidth: '200px', marginTop: '0.5rem', borderRadius: '0.5rem' }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        Nama Mempelai (Script)
                        <Tooltip
                            id="closing-names"
                            text="Nama mempelai untuk ditampilkan (contoh: Siti & Ahmad)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.namesScript}
                        onChange={(e) => handleChange('namesScript', e.target.value)}
                        placeholder="Siti & Ahmad"
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        Pesan Penutup
                        <Tooltip
                            id="closing-message"
                            text="Pesan penutup (pisahkan dengan enter untuk baris baru)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <textarea
                        value={data.messageLines.join('\n')}
                        onChange={(e) => handleChange('messageLines', e.target.value.split('\n'))}
                        placeholder="Terima kasih atas kehadiran dan doa restu Anda"
                        rows={4}
                        disabled={disabled}
                    />
                </div>
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleMediaSelect}
                fileType="photo"
                multiple={false}
                selectedUrls={data.photoSrc ? [data.photoSrc] : []}
            />

            <style jsx>{`
        ${editorStyles}

        .input-with-button {
          display: flex;
          gap: 0.5rem;
        }

        .input-with-button input {
          flex: 1;
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
          white-space: nowrap;
        }

        .btn-library:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-1px);
        }

        .btn-library:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .image-preview {
          margin-top: 0.5rem;
        }

        .image-preview img {
          display: block;
          max-width: 200px;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
        </>
    );
};
