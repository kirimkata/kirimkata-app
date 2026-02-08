'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  InvitationFormData,
  GalleryData,
  WeddingGiftData,
  BackgroundMusicData,
  ClosingData,
} from './types';
import { API_ENDPOINTS } from '@/lib/api-config';
import { BrideGroomSection } from './components/BrideGroomSection';
import { EventSection } from './components/EventSection';
import { LoveStorySection } from './components/LoveStorySection';
import { GallerySection } from './components/GallerySection';
import { WeddingGiftSection } from './components/WeddingGiftSection';
import { BackgroundMusicSection } from './components/BackgroundMusicSection';
import { ClosingSection } from './components/ClosingSection';
import { CollapsibleSection } from './components/CollapsibleSection';


export default function EditUndanganPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    brideGroom: true,
    event: true,
    loveStory: true,
    gallery: true,
    weddingGift: true,
    backgroundMusic: true,
    closing: true,
  });

  // Track unsaved changes per section
  const [savedFormData, setSavedFormData] = useState<InvitationFormData | null>(null);
  const [unsavedSections, setUnsavedSections] = useState({
    brideGroom: false,
    event: false,
    loveStory: false,
    gallery: false,
    weddingGift: false,
    backgroundMusic: false,
    closing: false,
  });
  const [savingSections, setSavingSections] = useState({
    brideGroom: false,
    event: false,
    loveStory: false,
    gallery: false,
    weddingGift: false,
    backgroundMusic: false,
    closing: false,
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('client_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.client.invitationContent, {
          headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_user');
            router.push('/client-dashboard/login');
            return;
          }
          if (response.status === 404) {
            setMessage({
              type: 'error',
              text: 'Anda belum memiliki undangan yang di-assign. Silakan hubungi admin.',
            });
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Failed to fetch data');
        }

        if (data.success && data.content) {
          // Map eventCloud to event structure
          const eventCloudData = data.content.eventCloud || {};
          const eventData = data.content.event || {};

          const loadedData = {
            bride: data.content.bride || formData.bride,
            groom: data.content.groom || formData.groom,
            event: {
              fullDateLabel: eventData.fullDateLabel || '',
              isoDate: eventData.isoDate || '',
              countdownDateTime: eventData.countdownDateTime || '',
              holyMatrimony: {
                title: 'Akad',
                dateLabel: eventCloudData.holyMatrimony?.dateLabel || '',
                timeLabel: eventCloudData.holyMatrimony?.timeLabel || '',
                venueName: eventCloudData.holyMatrimony?.venueName || '',
                venueAddress: eventCloudData.holyMatrimony?.venueAddress || '',
                mapsUrl: eventCloudData.holyMatrimony?.mapsUrl || '',
              },
              reception: {
                title: 'Resepsi',
                dateLabel: eventCloudData.reception?.dateLabel || '',
                timeLabel: eventCloudData.reception?.timeLabel || '',
                venueName: eventCloudData.reception?.venueName || '',
                venueAddress: eventCloudData.reception?.venueAddress || '',
                mapsUrl: eventCloudData.reception?.mapsUrl || '',
              },
            },
            loveStory: data.content.loveStory || formData.loveStory,
            gallery: data.content.gallery || formData.gallery,
            weddingGift: data.content.weddingGift || formData.weddingGift,
            backgroundMusic: data.content.backgroundMusic || formData.backgroundMusic,
            closing: data.content.closing || formData.closing,
          };

          setFormData(loadedData);
          setSavedFormData(loadedData); // Initialize saved state
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Gagal memuat data. Silakan refresh halaman.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tooltip-wrapper')) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Detect unsaved changes for all sections
  useEffect(() => {
    if (!savedFormData) return;

    setUnsavedSections({
      brideGroom: JSON.stringify(formData.bride) !== JSON.stringify(savedFormData.bride) ||
        JSON.stringify(formData.groom) !== JSON.stringify(savedFormData.groom),
      event: JSON.stringify(formData.event) !== JSON.stringify(savedFormData.event),
      loveStory: JSON.stringify(formData.loveStory) !== JSON.stringify(savedFormData.loveStory),
      gallery: JSON.stringify(formData.gallery) !== JSON.stringify(savedFormData.gallery),
      weddingGift: JSON.stringify(formData.weddingGift) !== JSON.stringify(savedFormData.weddingGift),
      backgroundMusic: JSON.stringify(formData.backgroundMusic) !== JSON.stringify(savedFormData.backgroundMusic),
      closing: JSON.stringify(formData.closing) !== JSON.stringify(savedFormData.closing),
    });
  }, [formData, savedFormData]);

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

  // Per-section save handlers (POC: BrideGroom and Gallery only)
  const handleSaveBrideGroom = async () => {
    // Validate bride & groom data
    if (!formData.bride.name.trim() || !formData.bride.fullName.trim()) {
      setMessage({ type: 'error', text: 'Nama mempelai wanita wajib diisi' });
      return;
    }
    if (!formData.groom.name.trim() || !formData.groom.fullName.trim()) {
      setMessage({ type: 'error', text: 'Nama mempelai pria wajib diisi' });
      return;
    }

    setSavingSections(prev => ({ ...prev, brideGroom: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      // Update saved state
      setSavedFormData(prev => prev ? { ...prev, bride: formData.bride, groom: formData.groom } : null);
      setMessage({ type: 'success', text: 'Informasi Mempelai berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, brideGroom: false }));
    }
  };

  const handleSaveGallery = async () => {
    setSavingSections(prev => ({ ...prev, gallery: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      // Update saved state
      setSavedFormData(prev => prev ? { ...prev, gallery: formData.gallery } : null);
      setMessage({ type: 'success', text: 'Galeri Foto berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, gallery: false }));
    }
  };

  const handleSaveEvent = async () => {
    setSavingSections(prev => ({ ...prev, event: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSavedFormData(prev => prev ? { ...prev, event: formData.event } : null);
      setMessage({ type: 'success', text: 'Acara & Waktu berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, event: false }));
    }
  };

  const handleSaveLoveStory = async () => {
    setSavingSections(prev => ({ ...prev, loveStory: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSavedFormData(prev => prev ? { ...prev, loveStory: formData.loveStory } : null);
      setMessage({ type: 'success', text: 'Love Story berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, loveStory: false }));
    }
  };

  const handleSaveWeddingGift = async () => {
    setSavingSections(prev => ({ ...prev, weddingGift: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSavedFormData(prev => prev ? { ...prev, weddingGift: formData.weddingGift } : null);
      setMessage({ type: 'success', text: 'Wedding Gift berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, weddingGift: false }));
    }
  };

  const handleSaveBackgroundMusic = async () => {
    setSavingSections(prev => ({ ...prev, backgroundMusic: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSavedFormData(prev => prev ? { ...prev, backgroundMusic: formData.backgroundMusic } : null);
      setMessage({ type: 'success', text: 'Background Music berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, backgroundMusic: false }));
    }
  };

  const handleSaveClosing = async () => {
    setSavingSections(prev => ({ ...prev, closing: true }));
    setMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.client.invitationContent, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setSavedFormData(prev => prev ? { ...prev, closing: formData.closing } : null);
      setMessage({ type: 'success', text: 'Penutup berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSavingSections(prev => ({ ...prev, closing: false }));
    }
  };

  const validateForm = (): boolean => {
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

    const instagramRegex = /^[a-zA-Z0-9._]*$/;
    if (formData.bride.instagram && !instagramRegex.test(formData.bride.instagram)) {
      setMessage({ type: 'error', text: 'Format Instagram mempelai wanita tidak valid (tanpa @)' });
      return false;
    }
    if (formData.groom.instagram && !instagramRegex.test(formData.groom.instagram)) {
      setMessage({ type: 'error', text: 'Format Instagram mempelai pria tidak valid (tanpa @)' });
      return false;
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/client/invitation-content', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setMessage({ type: 'success', text: 'Data berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memuat data...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 1rem;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <p>Kelola semua informasi undangan Anda</p>
      </div>

      <form onSubmit={handleSave}>
        {/* Section 1: Bride & Groom */}
        <div className="editor-card">
          <CollapsibleSection
            title="Informasi Mempelai"
            emoji="👥"
            isExpanded={expandedSections.brideGroom}
            onToggle={() => toggleSection('brideGroom')}
            hasUnsavedChanges={unsavedSections.brideGroom}
            onSave={handleSaveBrideGroom}
            saving={savingSections.brideGroom}
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
            hasUnsavedChanges={unsavedSections.event}
            onSave={handleSaveEvent}
            saving={savingSections.event}
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
            hasUnsavedChanges={unsavedSections.loveStory}
            onSave={handleSaveLoveStory}
            saving={savingSections.loveStory}
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
            hasUnsavedChanges={unsavedSections.gallery}
            onSave={handleSaveGallery}
            saving={savingSections.gallery}
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
            hasUnsavedChanges={unsavedSections.weddingGift}
            onSave={handleSaveWeddingGift}
            saving={savingSections.weddingGift}
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
            hasUnsavedChanges={unsavedSections.backgroundMusic}
            onSave={handleSaveBackgroundMusic}
            saving={savingSections.backgroundMusic}
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
            hasUnsavedChanges={unsavedSections.closing}
            onSave={handleSaveClosing}
            saving={savingSections.closing}
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

        {/* Message */}
        {message && <div className={`message ${message.type}`}>{message.text}</div>}

        {/* Actions */}
        <div className="actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Menyimpan...' : '💾 Simpan Semua Perubahan'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .editor-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 0.75rem 1.5rem;
        }

        .editor-header {
          margin-bottom: 1.25rem;
        }

        .editor-header h1 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 0.375rem 0;
        }

        .editor-header p {
          color: #6b7280;
          margin: 0;
          font-size: 0.875rem;
        }

        .editor-card {
          background: white;
          border-radius: 0.65rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.25rem;
        }

        .editor-card :global(h2) {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .message {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1.5rem 0;
        }

        .btn-save {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          font-family: 'Segoe UI', sans-serif;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .btn-save:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .btn-save:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Mobile Responsive */
        @media (max-width: 767px) {
          .editor-card {
            padding: 1rem;
          }

          .editor-header h1 {
            font-size: 1.5rem;
          }

          .actions {
            flex-direction: column;
          }

          .btn-save {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
