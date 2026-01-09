import React from 'react';
import { BrideGroomData } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';

interface BrideGroomSectionProps {
    data: BrideGroomData;
    onChange: (person: 'bride' | 'groom', field: string, value: string) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const BrideGroomSection: React.FC<BrideGroomSectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [expandedSection, setExpandedSection] = React.useState<'bride' | 'groom' | null>('bride');

    const toggleSection = (section: 'bride' | 'groom') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <>
            {/* Mempelai Wanita */}
            <div className="collapsible-section">
                <button type="button" className="section-header" onClick={() => toggleSection('bride')}>
                    <span className="section-title">💐 Mempelai Wanita</span>
                    <span className={`chevron ${expandedSection === 'bride' ? 'open' : ''}`}>▼</span>
                </button>

                {expandedSection === 'bride' && (
                    <div className="section-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Panggilan <span className="required">*</span>
                                    <Tooltip
                                        id="bride-name"
                                        text="Nama pendek yang akan ditampilkan di undangan (contoh: Siti)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.bride.name}
                                    onChange={(e) => onChange('bride', 'name', e.target.value)}
                                    placeholder="Siti"
                                    disabled={disabled}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Nama Lengkap <span className="required">*</span>
                                    <Tooltip
                                        id="bride-fullname"
                                        text="Nama lengkap sesuai KTP atau dokumen resmi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.bride.fullName}
                                    onChange={(e) => onChange('bride', 'fullName', e.target.value)}
                                    placeholder="Siti Nurhaliza Rahmawati"
                                    disabled={disabled}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Ayah
                                    <Tooltip
                                        id="bride-father"
                                        text="Nama ayah kandung (opsional, bisa dikosongkan)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.bride.fatherName}
                                    onChange={(e) => onChange('bride', 'fatherName', e.target.value)}
                                    placeholder="Bapak Budi Santoso"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Nama Ibu
                                    <Tooltip
                                        id="bride-mother"
                                        text="Nama ibu kandung (opsional, bisa dikosongkan)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.bride.motherName}
                                    onChange={(e) => onChange('bride', 'motherName', e.target.value)}
                                    placeholder="Ibu Dewi Lestari"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Instagram
                                    <Tooltip
                                        id="bride-instagram"
                                        text="Username Instagram tanpa @ (opsional)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <div className="input-with-prefix">
                                    <span className="prefix">@</span>
                                    <input
                                        type="text"
                                        value={data.bride.instagram}
                                        onChange={(e) => onChange('bride', 'instagram', e.target.value)}
                                        placeholder="sitinurhaliza"
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mempelai Pria */}
            <div className="collapsible-section">
                <button type="button" className="section-header" onClick={() => toggleSection('groom')}>
                    <span className="section-title">🤵 Mempelai Pria</span>
                    <span className={`chevron ${expandedSection === 'groom' ? 'open' : ''}`}>▼</span>
                </button>

                {expandedSection === 'groom' && (
                    <div className="section-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Panggilan <span className="required">*</span>
                                    <Tooltip
                                        id="groom-name"
                                        text="Nama pendek yang akan ditampilkan di undangan (contoh: Ahmad)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.groom.name}
                                    onChange={(e) => onChange('groom', 'name', e.target.value)}
                                    placeholder="Ahmad"
                                    disabled={disabled}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Nama Lengkap <span className="required">*</span>
                                    <Tooltip
                                        id="groom-fullname"
                                        text="Nama lengkap sesuai KTP atau dokumen resmi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.groom.fullName}
                                    onChange={(e) => onChange('groom', 'fullName', e.target.value)}
                                    placeholder="Ahmad Fauzi Rahman"
                                    disabled={disabled}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Ayah
                                    <Tooltip
                                        id="groom-father"
                                        text="Nama ayah kandung (opsional, bisa dikosongkan)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.groom.fatherName}
                                    onChange={(e) => onChange('groom', 'fatherName', e.target.value)}
                                    placeholder="Bapak Hadi Wijaya"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Nama Ibu
                                    <Tooltip
                                        id="groom-mother"
                                        text="Nama ibu kandung (opsional, bisa dikosongkan)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.groom.motherName}
                                    onChange={(e) => onChange('groom', 'motherName', e.target.value)}
                                    placeholder="Ibu Sri Wahyuni"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Instagram
                                    <Tooltip
                                        id="groom-instagram"
                                        text="Username Instagram tanpa @ (opsional)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <div className="input-with-prefix">
                                    <span className="prefix">@</span>
                                    <input
                                        type="text"
                                        value={data.groom.instagram}
                                        onChange={(e) => onChange('groom', 'instagram', e.target.value)}
                                        placeholder="ahmadfauzi"
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{editorStyles}</style>
        </>
    );
};
