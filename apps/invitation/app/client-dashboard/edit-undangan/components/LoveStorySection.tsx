import React from 'react';
import { LoveStoryData, LoveStoryBlock } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';

interface LoveStorySectionProps {
    data: LoveStoryData;
    onChange: (data: LoveStoryData) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const LoveStorySection: React.FC<LoveStorySectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [expandedBlock, setExpandedBlock] = React.useState<number | null>(0);

    const toggleBlock = (index: number) => {
        setExpandedBlock(expandedBlock === index ? null : index);
    };

    const handleTitleChange = (value: string) => {
        onChange({ ...data, mainTitle: value });
    };

    const handleBlockChange = (index: number, field: 'title' | 'body', value: string) => {
        const newBlocks = [...data.blocks];
        newBlocks[index] = { ...newBlocks[index], [field]: value };
        onChange({ ...data, blocks: newBlocks });
    };

    const addBlock = () => {
        onChange({
            ...data,
            blocks: [...data.blocks, { title: '', body: '' }],
        });
        setExpandedBlock(data.blocks.length);
    };

    const removeBlock = (index: number) => {
        const newBlocks = data.blocks.filter((_, i) => i !== index);
        onChange({ ...data, blocks: newBlocks });
        if (expandedBlock === index) {
            setExpandedBlock(null);
        }
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...data.blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        onChange({ ...data, blocks: newBlocks });
        setExpandedBlock(targetIndex);
    };

    return (
        <>
            <div className="form-row">
                <div className="form-group">
                    <label>
                        Judul Utama
                        <Tooltip
                            id="lovestory-title"
                            text="Judul section cerita cinta (contoh: Our Love Story)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.mainTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Our Love Story"
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="blocks-container">
                <div className="blocks-header">
                    <h3>Blok Cerita</h3>
                    <button
                        type="button"
                        className="btn-add-block"
                        onClick={addBlock}
                        disabled={disabled}
                    >
                        + Tambah Blok
                    </button>
                </div>

                {data.blocks.map((block, index) => (
                    <div key={index} className="collapsible-section">
                        <div
                            className="section-header"
                            onClick={() => toggleBlock(index)}
                        >
                            <span className="section-title">
                                📖 Blok {index + 1}: {block.title || '(Belum ada judul)'}
                            </span>
                            <div className="block-actions">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveBlock(index, 'up');
                                        }}
                                        disabled={disabled}
                                        title="Pindah ke atas"
                                    >
                                        ↑
                                    </button>
                                )}
                                {index < data.blocks.length - 1 && (
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveBlock(index, 'down');
                                        }}
                                        disabled={disabled}
                                        title="Pindah ke bawah"
                                    >
                                        ↓
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-icon btn-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Hapus blok ini?')) {
                                            removeBlock(index);
                                        }
                                    }}
                                    disabled={disabled}
                                    title="Hapus blok"
                                >
                                    🗑️
                                </button>
                                <span className={`chevron ${expandedBlock === index ? 'open' : ''}`}>▼</span>
                            </div>
                        </div>

                        {expandedBlock === index && (
                            <div className="section-content">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            Judul Blok
                                            <Tooltip
                                                id={`block-${index}-title`}
                                                text="Judul untuk blok cerita ini"
                                                activeTooltip={activeTooltip}
                                                onToggle={onTooltipToggle}
                                            />
                                        </label>
                                        <input
                                            type="text"
                                            value={block.title}
                                            onChange={(e) => handleBlockChange(index, 'title', e.target.value)}
                                            placeholder="The Beginning"
                                            disabled={disabled}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            Isi Cerita
                                            <Tooltip
                                                id={`block-${index}-body`}
                                                text="Tuliskan cerita untuk blok ini"
                                                activeTooltip={activeTooltip}
                                                onToggle={onTooltipToggle}
                                            />
                                        </label>
                                        <textarea
                                            value={block.body}
                                            onChange={(e) => handleBlockChange(index, 'body', e.target.value)}
                                            placeholder="Our story began like a quiet song..."
                                            disabled={disabled}
                                            rows={5}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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

        .block-actions {
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
      `}</style>
        </>
    );
};
