import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    hasUnsavedChanges?: boolean;
    onSave?: () => void;
    saving?: boolean;
    hideSaveButton?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    isExpanded,
    onToggle,
    children,
    hasUnsavedChanges = false,
    onSave,
    saving = false,
    hideSaveButton = false,
}) => {
    return (
        <>
            <div className="collapsible-wrapper">
                <div className="collapsible-header" onClick={onToggle}>
                    <div className="header-left">
                        <h2>
                            <span className="section-icon">{icon}</span>
                            {title}
                            {hasUnsavedChanges && <span className="unsaved-dot" title="Ada perubahan belum disimpan"></span>}
                        </h2>
                    </div>
                    <div className="header-right">
                        {!hideSaveButton && onSave && (
                            <button
                                type="button"
                                className={`btn-save ${!hasUnsavedChanges || saving ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!saving && hasUnsavedChanges) {
                                        onSave();
                                    }
                                }}
                                disabled={!hasUnsavedChanges || saving}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        )}
                        <ChevronDown
                            size={20}
                            style={{
                                strokeWidth: 2.5,
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                color: 'rgba(245, 245, 240, 0.6)'
                            }}
                        />
                    </div>
                </div>
                {isExpanded && <div className="collapsible-content">{children}</div>}
            </div>

            <style jsx>{`
                .collapsible-wrapper {
                    margin-bottom: 0;
                }

                .collapsible-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                    padding: 0.5rem 0;
                    transition: all 0.2s ease;
                }

                .collapsible-header:hover {
                    opacity: 0.8;
                }

                .header-left {
                    flex: 1;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .collapsible-header h2 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #F5F5F0;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .section-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #F5F5F0;
                }

                .unsaved-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #f97316;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .btn-save {
                    padding: 0.375rem 0.875rem;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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

                .btn-save:hover:not(.disabled) {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .btn-save.disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(245, 245, 240, 0.3);
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .collapsible-content {
                    padding-top: 0.5rem;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};
