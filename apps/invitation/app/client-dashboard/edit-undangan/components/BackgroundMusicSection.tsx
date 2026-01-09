import React, { useState } from 'react';
import { BackgroundMusicData } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';
import MediaPicker from './MediaPicker';

interface BackgroundMusicSectionProps {
    data: BackgroundMusicData;
    onChange: (data: BackgroundMusicData) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const BackgroundMusicSection: React.FC<BackgroundMusicSectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const handleChange = (field: keyof BackgroundMusicData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const handleMediaSelect = (file: any) => {
        handleChange('src', file.file_url);
        setShowMediaPicker(false);
    };

    return (
        <>
            <div className="form-row">
                <div className="form-group">
                    <label>
                        URL File Musik <span className="required">*</span>
                        <Tooltip
                            id="music-src"
                            text="URL file audio MP3 (contoh: https://media.kirimkata.com/song.mp3)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <div className="input-with-button">
                        <input
                            type="url"
                            value={data.src}
                            onChange={(e) => handleChange('src', e.target.value)}
                            placeholder="https://media.kirimkata.com/song.mp3"
                            disabled={disabled}
                            required
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
                    {data.src && (
                        <div className="audio-preview">
                            <audio controls src={data.src} style={{ width: '100%', marginTop: '0.5rem' }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        Judul Lagu
                        <Tooltip
                            id="music-title"
                            text="Judul lagu yang diputar"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Close To You"
                        disabled={disabled}
                    />
                </div>

                <div className="form-group">
                    <label>
                        Artis/Penyanyi
                        <Tooltip
                            id="music-artist"
                            text="Nama artis atau penyanyi"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.artist}
                        onChange={(e) => handleChange('artist', e.target.value)}
                        placeholder="Lady Gaga"
                        disabled={disabled}
                    />
                </div>
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleMediaSelect}
                fileType="music"
                multiple={false}
                selectedUrls={data.src ? [data.src] : []}
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

        .audio-preview {
          margin-top: 0.5rem;
        }

        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          margin-top: 1rem;
        }

        .info-box p {
          margin: 0;
          font-size: 0.8125rem;
          color: #1e40af;
          line-height: 1.5;
        }
      `}</style>
        </>
    );
};
