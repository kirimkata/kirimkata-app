import React from 'react';
import { EventData } from '../types';
import { Tooltip } from './Tooltip';
import { editorStyles } from './styles';

interface EventSectionProps {
    data: EventData;
    onChange: (field: string, value: any) => void;
    disabled: boolean;
    activeTooltip: string | null;
    onTooltipToggle: (id: string, e: React.MouseEvent) => void;
}

export const EventSection: React.FC<EventSectionProps> = ({
    data,
    onChange,
    disabled,
    activeTooltip,
    onTooltipToggle,
}) => {
    const [expandedSection, setExpandedSection] = React.useState<'akad' | 'resepsi' | null>('akad');

    const toggleSection = (section: 'akad' | 'resepsi') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const handleEventChange = (eventType: 'holyMatrimony' | 'reception', field: string, value: string) => {
        onChange(eventType, {
            ...data[eventType],
            [field]: value,
        });
    };

    return (
        <>
            {/* Tanggal Utama */}
            <div className="form-row">
                <div className="form-group">
                    <label>
                        Tanggal Acara <span className="required">*</span>
                        <Tooltip
                            id="event-date"
                            text="Tanggal lengkap acara (contoh: Sabtu, 27 Desember 2025)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="text"
                        value={data.fullDateLabel}
                        onChange={(e) => onChange('fullDateLabel', e.target.value)}
                        placeholder="Sabtu, 27 Desember 2025"
                        disabled={disabled}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>
                        Tanggal ISO <span className="required">*</span>
                        <Tooltip
                            id="event-iso-date"
                            text="Format: YYYY-MM-DD (contoh: 2025-12-27)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="date"
                        value={data.isoDate}
                        onChange={(e) => onChange('isoDate', e.target.value)}
                        disabled={disabled}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        Waktu Countdown <span className="required">*</span>
                        <Tooltip
                            id="event-countdown"
                            text="Format: YYYY-MM-DDTHH:mm:ss+07:00 (contoh: 2025-12-27T08:00:00+07:00)"
                            activeTooltip={activeTooltip}
                            onToggle={onTooltipToggle}
                        />
                    </label>
                    <input
                        type="datetime-local"
                        value={data.countdownDateTime?.slice(0, 16) || ''}
                        onChange={(e) => onChange('countdownDateTime', e.target.value + ':00+07:00')}
                        disabled={disabled}
                        required
                    />
                </div>
            </div>

            {/* Akad Nikah */}
            <div className="collapsible-section">
                <button type="button" className="section-header" onClick={() => toggleSection('akad')}>
                    <span className="section-title">🕌 Akad Nikah</span>
                    <span className={`chevron ${expandedSection === 'akad' ? 'open' : ''}`}>▼</span>
                </button>

                {expandedSection === 'akad' && (
                    <div className="section-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Tanggal
                                    <Tooltip
                                        id="akad-date"
                                        text="Tanggal akad nikah"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.holyMatrimony.dateLabel}
                                    onChange={(e) => handleEventChange('holyMatrimony', 'dateLabel', e.target.value)}
                                    placeholder="Sabtu, 27 Desember 2025"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Waktu
                                    <Tooltip
                                        id="akad-time"
                                        text="Waktu pelaksanaan akad"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.holyMatrimony.timeLabel}
                                    onChange={(e) => handleEventChange('holyMatrimony', 'timeLabel', e.target.value)}
                                    placeholder="08.00 WIB - Selesai"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Tempat
                                    <Tooltip
                                        id="akad-venue"
                                        text="Nama gedung/masjid/tempat akad"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.holyMatrimony.venueName}
                                    onChange={(e) => handleEventChange('holyMatrimony', 'venueName', e.target.value)}
                                    placeholder="Masjid Agung Al Mabrur"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Alamat Lengkap
                                    <Tooltip
                                        id="akad-address"
                                        text="Alamat lengkap tempat akad (gunakan \n untuk baris baru)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <textarea
                                    value={data.holyMatrimony.venueAddress}
                                    onChange={(e) => handleEventChange('holyMatrimony', 'venueAddress', e.target.value)}
                                    placeholder="Jl. Ahmad Yani, Desa Sidomulyo,\nKec. Ungaran Timur, Kab. Semarang"
                                    disabled={disabled}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Link Google Maps
                                    <Tooltip
                                        id="akad-maps"
                                        text="URL Google Maps lokasi akad"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="url"
                                    value={data.holyMatrimony.mapsUrl}
                                    onChange={(e) => handleEventChange('holyMatrimony', 'mapsUrl', e.target.value)}
                                    placeholder="https://maps.app.goo.gl/..."
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resepsi */}
            <div className="collapsible-section">
                <button type="button" className="section-header" onClick={() => toggleSection('resepsi')}>
                    <span className="section-title">🎉 Resepsi</span>
                    <span className={`chevron ${expandedSection === 'resepsi' ? 'open' : ''}`}>▼</span>
                </button>

                {expandedSection === 'resepsi' && (
                    <div className="section-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Tanggal
                                    <Tooltip
                                        id="resepsi-date"
                                        text="Tanggal resepsi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.reception.dateLabel}
                                    onChange={(e) => handleEventChange('reception', 'dateLabel', e.target.value)}
                                    placeholder="Sabtu, 27 Desember 2025"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Waktu
                                    <Tooltip
                                        id="resepsi-time"
                                        text="Waktu pelaksanaan resepsi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.reception.timeLabel}
                                    onChange={(e) => handleEventChange('reception', 'timeLabel', e.target.value)}
                                    placeholder="12.00 WIB - Selesai"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Nama Tempat
                                    <Tooltip
                                        id="resepsi-venue"
                                        text="Nama gedung/tempat resepsi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={data.reception.venueName}
                                    onChange={(e) => handleEventChange('reception', 'venueName', e.target.value)}
                                    placeholder="Gedung Serbaguna"
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Alamat Lengkap
                                    <Tooltip
                                        id="resepsi-address"
                                        text="Alamat lengkap tempat resepsi (gunakan \n untuk baris baru)"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <textarea
                                    value={data.reception.venueAddress}
                                    onChange={(e) => handleEventChange('reception', 'venueAddress', e.target.value)}
                                    placeholder="Jl. Ahmad Yani, Desa Sidomulyo,\nKec. Ungaran Timur, Kab. Semarang"
                                    disabled={disabled}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Link Google Maps
                                    <Tooltip
                                        id="resepsi-maps"
                                        text="URL Google Maps lokasi resepsi"
                                        activeTooltip={activeTooltip}
                                        onToggle={onTooltipToggle}
                                    />
                                </label>
                                <input
                                    type="url"
                                    value={data.reception.mapsUrl}
                                    onChange={(e) => handleEventChange('reception', 'mapsUrl', e.target.value)}
                                    placeholder="https://maps.app.goo.gl/..."
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{editorStyles}</style>
        </>
    );
};
