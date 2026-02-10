import React from 'react';
import { WeddingGiftData, BankAccount } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';

interface WeddingGiftSectionProps {
    data: WeddingGiftData;
    onChange: (data: WeddingGiftData) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const WeddingGiftSection: React.FC<WeddingGiftSectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const handleFieldChange = (field: keyof WeddingGiftData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const handleBankChange = (index: number, field: keyof BankAccount, value: string) => {
        const newBanks = [...data.bankAccounts];
        newBanks[index] = { ...newBanks[index], [field]: value };
        onChange({ ...data, bankAccounts: newBanks });
    };

    const addBank = () => {
        onChange({
            ...data,
            bankAccounts: [...data.bankAccounts, { templateId: '', accountNumber: '', accountName: '' }],
        });
    };

    const removeBank = (index: number) => {
        const newBanks = data.bankAccounts.filter((_, i) => i !== index);
        onChange({ ...data, bankAccounts: newBanks });
    };

    const handlePhysicalGiftChange = (field: string, value: any) => {
        onChange({
            ...data,
            physicalGift: { ...data.physicalGift, [field]: value },
        });
    };

    return (
        <>
            <div className="form-row">
                <div className="form-group">
                    <label>
                        Judul
                        <Tooltip
                            id="gift-title"
                            text="Judul section hadiah"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="Wedding Gift"
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        Subtitle
                        <Tooltip
                            id="gift-subtitle"
                            text="Pesan ucapan terima kasih"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <textarea
                        value={data.subtitle || ''}
                        onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                        placeholder="We're so grateful for your love and support..."
                        disabled={disabled}
                        rows={2}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Label Tombol</label>
                    <input
                        type="text"
                        value={data.buttonLabel || ''}
                        onChange={(e) => handleFieldChange('buttonLabel', e.target.value)}
                        placeholder="Kirim Hadiah"
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="blocks-container">
                <div className="blocks-header">
                    <h3>Rekening Bank</h3>
                    <button type="button" className="btn-add-block" onClick={addBank} disabled={disabled}>
                        + Tambah Rekening
                    </button>
                </div>

                {data.bankAccounts.map((bank, index) => (
                    <div key={index} className="bank-item">
                        <div className="bank-header">
                            <span className="bank-number">Rekening {index + 1}</span>
                            <button
                                type="button"
                                className="btn-icon btn-delete"
                                onClick={() => {
                                    if (confirm('Hapus rekening ini?')) {
                                        removeBank(index);
                                    }
                                }}
                                disabled={disabled}
                            >
                                🗑️
                            </button>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nama Bank</label>
                                <input
                                    type="text"
                                    value={bank.templateId || ''}
                                    onChange={(e) => handleBankChange(index, 'templateId', e.target.value)}
                                    placeholder="BCA / Mandiri / BNI"
                                    disabled={disabled}
                                />
                            </div>
                            <div className="form-group">
                                <label>Nomor Rekening</label>
                                <input
                                    type="text"
                                    value={bank.accountNumber || ''}
                                    onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                                    placeholder="1234567890"
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nama Pemilik</label>
                                <input
                                    type="text"
                                    value={bank.accountName || ''}
                                    onChange={(e) => handleBankChange(index, 'accountName', e.target.value)}
                                    placeholder="Nama sesuai rekening"
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="physical-gift-section">
                <h3>Alamat Pengiriman Hadiah Fisik</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Nama Penerima</label>
                        <input
                            type="text"
                            value={data.physicalGift.recipientName || ''}
                            onChange={(e) => handlePhysicalGiftChange('recipientName', e.target.value)}
                            placeholder="Nama penerima"
                            disabled={disabled}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nomor Telepon</label>
                        <input
                            type="tel"
                            value={data.physicalGift.phone || ''}
                            onChange={(e) => handlePhysicalGiftChange('phone', e.target.value)}
                            placeholder="08123456789"
                            disabled={disabled}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>
                            Alamat Lengkap
                            <Tooltip
                                id="gift-address"
                                text="Pisahkan dengan enter untuk baris baru"
                                activeTooltip={activeTooltip}
                                onToggle={onTooltipToggle}
                            />
                        </label>
                        <textarea
                            value={(data.physicalGift.addressLines || []).join('\n')}
                            onChange={(e) =>
                                handlePhysicalGiftChange('addressLines', e.target.value.split('\n'))
                            }
                            placeholder="Jl. Contoh No. 123&#10;Jakarta Selatan"
                            disabled={disabled}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <style jsx>{`
        ${editorStyles}

        .blocks-container {
          margin-top: 1.5rem;
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

        .bank-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
        }

        .bank-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .bank-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
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

        .physical-gift-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .physical-gift-section h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }
      `}</style>
        </>
    );
};
