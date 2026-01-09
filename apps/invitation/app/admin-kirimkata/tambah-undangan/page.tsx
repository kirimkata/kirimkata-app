'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AVAILABLE_THEMES } from '@/lib/themes/availableThemes';
import {
    InvitationFormData,
    GalleryData,
    WeddingGiftData,
    BackgroundMusicData,
    ClosingData,
} from '@/app/client-dashboard/edit-undangan/types';
import { BrideGroomSection } from '@/app/client-dashboard/edit-undangan/components/BrideGroomSection';
import { EventSection } from '@/app/client-dashboard/edit-undangan/components/EventSection';
import { LoveStorySection } from '@/app/client-dashboard/edit-undangan/components/LoveStorySection';
import { GallerySection } from '@/app/client-dashboard/edit-undangan/components/GallerySection';
import { WeddingGiftSection } from '@/app/client-dashboard/edit-undangan/components/WeddingGiftSection';
import { BackgroundMusicSection } from '@/app/client-dashboard/edit-undangan/components/BackgroundMusicSection';
import { ClosingSection } from '@/app/client-dashboard/edit-undangan/components/ClosingSection';
import { CollapsibleSection } from '@/app/client-dashboard/edit-undangan/components/CollapsibleSection';

export default function TambahUndanganPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string>(AVAILABLE_THEMES[0].key);
    const [slug, setSlug] = useState('');
    const [clientSlug, setClientSlug] = useState(''); // For client profile data

    const [expandedSections, setExpandedSections] = useState({
        brideGroom: true,
        event: true,
        loveStory: true,
        gallery: true,
        weddingGift: true,
        backgroundMusic: true,
        closing: true,
    });

    const [formData, setFormData] = useState<InvitationFormData>({
        bride: {
            name: '',
            fullName: '',
            fatherName: '',
            motherName: '',
            instagram: '',
        },
        groom: {
            name: '',
            fullName: '',
            fatherName: '',
            motherName: '',
            instagram: '',
        },
        event: {
            fullDateLabel: '',
            isoDate: '',
            countdownDateTime: '',
            holyMatrimony: {
                title: 'Akad',
                dateLabel: '',
                timeLabel: '',
                venueName: '',
                venueAddress: '',
                mapsUrl: '',
            },
            reception: {
                title: 'Resepsi',
                dateLabel: '',
                timeLabel: '',
                venueName: '',
                venueAddress: '',
                mapsUrl: '',
            },
        },
        loveStory: {
            mainTitle: 'Our Love Story',
            blocks: [],
        },
        gallery: {
            mainTitle: 'Our Moments',
            middleImages: [],
            youtubeEmbedUrl: '',
            showYoutube: false,
        },
        weddingGift: {
            title: 'Wedding Gift',
            subtitle: '',
            buttonLabel: 'Kirim Hadiah',
            bankAccounts: [],
            physicalGift: {
                recipientName: '',
                phone: '',
                addressLines: [],
            },
        },
        backgroundMusic: {
            src: '',
            title: '',
            artist: '',
        },
        closing: {
            photoSrc: '',
            namesScript: '',
            messageLines: [],
        },
    });

    const handleBrideGroomChange = (person: 'bride' | 'groom', field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [person]: {
                ...prev[person],
                [field]: value,
            },
        }));
    };

    const handleEventChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            event: {
                ...prev.event,
                [field]: value,
            },
        }));
    };

    const handleLoveStoryChange = (data: any) => {
        setFormData((prev) => ({ ...prev, loveStory: data }));
    };

    const handleGalleryChange = (data: GalleryData) => {
        setFormData((prev) => ({ ...prev, gallery: data }));
    };

    const handleWeddingGiftChange = (data: WeddingGiftData) => {
        setFormData((prev) => ({ ...prev, weddingGift: data }));
    };

    const handleBackgroundMusicChange = (data: BackgroundMusicData) => {
        setFormData((prev) => ({ ...prev, backgroundMusic: data }));
    };

    const handleClosingChange = (data: ClosingData) => {
        setFormData((prev) => ({ ...prev, closing: data }));
    };

    const toggleTooltip = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveTooltip(activeTooltip === id ? null : id);
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const validateForm = (): boolean => {
        if (!slug.trim()) {
            setMessage({ type: 'error', text: 'Slug wajib diisi' });
            return false;
        }

        // Validate slug format (lowercase, alphanumeric, hyphens only)
        if (!/^[a-z0-9-]+$/.test(slug)) {
            setMessage({ type: 'error', text: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)' });
            return false;
        }

        if (!formData.bride.name.trim()) {
            setMessage({ type: 'error', text: 'Nama panggilan mempelai wanita wajib diisi' });
            return false;
        }
        if (!formData.bride.fullName.trim()) {
            setMessage({ type: 'error', text: 'Nama lengkap mempelai wanita wajib diisi' });
            return false;
        }
        if (!formData.groom.name.trim()) {
            setMessage({ type: 'error', text: 'Nama panggilan mempelai pria wajib diisi' });
            return false;
        }
        if (!formData.groom.fullName.trim()) {
            setMessage({ type: 'error', text: 'Nama lengkap mempelai pria wajib diisi' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('/api/admin/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    slug,
                    themeKey: selectedTheme,
                    clientProfile: {
                        slug,
                        coupleNames: `${formData.bride.name} & ${formData.groom.name}`,
                        weddingDateLabel: formData.event.fullDateLabel,
                    },
                    bride: formData.bride,
                    groom: formData.groom,
                    event: formData.event,
                    loveStory: formData.loveStory,
                    gallery: formData.gallery,
                    weddingGift: formData.weddingGift,
                    backgroundMusic: formData.backgroundMusic,
                    closing: formData.closing,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Gagal menyimpan undangan');
            }

            setMessage({ type: 'success', text: `Undangan berhasil dibuat! Slug: /${slug}` });
            setTimeout(() => {
                router.push('/admin-kirimkata/clients');
            }, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <h1>Tambah Undangan Baru</h1>
                <p>Buat undangan baru dengan tema pilihan Anda</p>
            </div>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Theme & Slug Selection */}
                <div className="editor-card">
                    <div className="card-header-static">
                        <h2>⚙️ Pengaturan Dasar</h2>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label htmlFor="theme-select">
                                Pilih Tema <span className="required">*</span>
                            </label>
                            <select
                                id="theme-select"
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="theme-select"
                                disabled={saving}
                            >
                                {AVAILABLE_THEMES.map((theme) => (
                                    <option key={theme.key} value={theme.key}>
                                        {theme.name} - {theme.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="slug-input">
                                Slug (URL Undangan) <span className="required">*</span>
                            </label>
                            <div className="slug-input-wrapper">
                                <span className="slug-prefix">kirimkata.com/</span>
                                <input
                                    id="slug-input"
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="nama-mempelai"
                                    className="slug-input"
                                    disabled={saving}
                                    required
                                />
                            </div>
                            <small className="help-text">Hanya huruf kecil, angka, dan tanda hubung (-)</small>
                        </div>
                    </div>
                </div>

                {/* Section 1: Bride & Groom */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Informasi Mempelai"
                        emoji="👥"
                        isExpanded={expandedSections.brideGroom}
                        onToggle={() => toggleSection('brideGroom')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <BrideGroomSection
                            data={{ bride: formData.bride, groom: formData.groom }}
                            onChange={handleBrideGroomChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 2: Event */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Acara & Waktu"
                        emoji="📅"
                        isExpanded={expandedSections.event}
                        onToggle={() => toggleSection('event')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <EventSection
                            data={formData.event}
                            onChange={handleEventChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 3: Love Story */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Cerita Cinta"
                        emoji="💕"
                        isExpanded={expandedSections.loveStory}
                        onToggle={() => toggleSection('loveStory')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <LoveStorySection
                            data={formData.loveStory}
                            onChange={handleLoveStoryChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 4: Gallery */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Galeri Foto"
                        emoji="📸"
                        isExpanded={expandedSections.gallery}
                        onToggle={() => toggleSection('gallery')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <GallerySection
                            data={formData.gallery}
                            onChange={handleGalleryChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 5: Wedding Gift */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Hadiah Pernikahan"
                        emoji="🎁"
                        isExpanded={expandedSections.weddingGift}
                        onToggle={() => toggleSection('weddingGift')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <WeddingGiftSection
                            data={formData.weddingGift}
                            onChange={handleWeddingGiftChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 6: Background Music */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Musik Latar"
                        emoji="🎵"
                        isExpanded={expandedSections.backgroundMusic}
                        onToggle={() => toggleSection('backgroundMusic')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <BackgroundMusicSection
                            data={formData.backgroundMusic}
                            onChange={handleBackgroundMusicChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Section 7: Closing */}
                <div className="editor-card">
                    <CollapsibleSection
                        title="Penutup"
                        emoji="🎨"
                        isExpanded={expandedSections.closing}
                        onToggle={() => toggleSection('closing')}
                        hasUnsavedChanges={false}
                        onSave={async () => { }}
                        saving={false}
                        hideSaveButton={true}
                    >
                        <ClosingSection
                            data={formData.closing}
                            onChange={handleClosingChange}
                            disabled={saving}
                            activeTooltip={activeTooltip}
                            onTooltipToggle={toggleTooltip}
                        />
                    </CollapsibleSection>
                </div>

                {/* Submit Button */}
                <div className="submit-section">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-submit"
                    >
                        {saving ? 'Menyimpan...' : '✅ Simpan Undangan'}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .editor-container {
          max-width: 900px;
          margin: 0 auto;
          padding-bottom: 2rem;
        }

        .editor-header {
          margin-bottom: 2rem;
        }

        .editor-header h1 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .editor-header p {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .message {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #dc2626;
        }

        .editor-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .card-header-static {
          padding: 1rem 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-header-static h2 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .card-content {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .required {
          color: #dc2626;
        }

        .theme-select,
        .slug-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: 'Segoe UI', sans-serif;
        }

        .theme-select:focus,
        .slug-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          overflow: hidden;
        }

        .slug-input-wrapper:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .slug-prefix {
          padding: 0.625rem 0.75rem;
          background: #f9fafb;
          color: #6b7280;
          font-size: 0.875rem;
          border-right: 1px solid #d1d5db;
          white-space: nowrap;
        }

        .slug-input {
          border: none;
          flex: 1;
        }

        .slug-input:focus {
          box-shadow: none;
        }

        .help-text {
          display: block;
          margin-top: 0.375rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .submit-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .btn-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .editor-container {
            padding: 0 1rem 2rem;
          }

          .editor-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
        </div>
    );
}
