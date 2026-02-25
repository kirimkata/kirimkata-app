'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Image,
  Gift,
  Music,
  MessageSquare,
  ClipboardList,
  ArrowRight
} from 'lucide-react';

import {
  InvitationFormData,
  GalleryData,
  WeddingGiftData,
  BackgroundMusicData,
  ClosingData,
} from './types';
import { InvitationAPI } from '@/lib/api/client';
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
    loveStory: true,
    gallery: true,
    weddingGift: true,
    backgroundMusic: true,
    closing: true,
  });

  // Track unsaved changes per section
  const [savedFormData, setSavedFormData] = useState<InvitationFormData | null>(null);
  const [unsavedSections, setUnsavedSections] = useState({
    loveStory: false,
    gallery: false,
    weddingGift: false,
    backgroundMusic: false,
    closing: false,
  });
  const [savingSections, setSavingSections] = useState({
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
        const token = localStorage.getItem('client_token');
        if (!token) {
          router.push('/client-dashboard/login');
          return;
        }

        const data = await InvitationAPI.getInvitationContent(token);

        if (!data.success) {
          if (data.error === 'Unauthorized' || data.message === 'Unauthorized') {
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_user');
            router.push('/client-dashboard/login');
            return;
          }
          if (data.error === 'Invitation not found' || data.message === 'Invitation not found') {
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
          // Map eventDetails to event structure
          const eventDetailsData = data.content.eventDetails || {};
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
                dateLabel: eventDetailsData.holyMatrimony?.dateLabel || '',
                timeLabel: eventDetailsData.holyMatrimony?.timeLabel || '',
                venueName: eventDetailsData.holyMatrimony?.venueName || '',
                venueAddress: eventDetailsData.holyMatrimony?.venueAddress || '',
                mapsUrl: eventDetailsData.holyMatrimony?.mapsUrl || '',
              },
              reception: {
                title: 'Resepsi',
                dateLabel: eventDetailsData.reception?.dateLabel || '',
                timeLabel: eventDetailsData.reception?.timeLabel || '',
                venueName: eventDetailsData.reception?.venueName || '',
                venueAddress: eventDetailsData.reception?.venueAddress || '',
                mapsUrl: eventDetailsData.reception?.mapsUrl || '',
              },
            },
            loveStory: data.content.loveStory || formData.loveStory,
            gallery: data.content.gallery || formData.gallery,
            weddingGift: data.content.weddingGift || formData.weddingGift,
            backgroundMusic: data.content.musicSettings || formData.backgroundMusic,
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

  // Detect unsaved changes for supplementary sections only
  useEffect(() => {
    if (!savedFormData) return;

    setUnsavedSections({
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

  const handleSaveGallery = async () => {
    setSavingSections(prev => ({ ...prev, gallery: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setSavedFormData(prev => prev ? { ...prev, gallery: formData.gallery } : null);
      setMessage({ type: 'success', text: 'Galeri Foto berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSavingSections(prev => ({ ...prev, gallery: false })); }
  };

  const handleSaveLoveStory = async () => {
    setSavingSections(prev => ({ ...prev, loveStory: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setSavedFormData(prev => prev ? { ...prev, loveStory: formData.loveStory } : null);
      setMessage({ type: 'success', text: 'Love Story berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSavingSections(prev => ({ ...prev, loveStory: false })); }
  };

  const handleSaveWeddingGift = async () => {
    setSavingSections(prev => ({ ...prev, weddingGift: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setSavedFormData(prev => prev ? { ...prev, weddingGift: formData.weddingGift } : null);
      setMessage({ type: 'success', text: 'Wedding Gift berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSavingSections(prev => ({ ...prev, weddingGift: false })); }
  };

  const handleSaveBackgroundMusic = async () => {
    setSavingSections(prev => ({ ...prev, backgroundMusic: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setSavedFormData(prev => prev ? { ...prev, backgroundMusic: formData.backgroundMusic } : null);
      setMessage({ type: 'success', text: 'Background Music berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSavingSections(prev => ({ ...prev, backgroundMusic: false })); }
  };

  const handleSaveClosing = async () => {
    setSavingSections(prev => ({ ...prev, closing: true }));
    setMessage(null);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setSavedFormData(prev => prev ? { ...prev, closing: formData.closing } : null);
      setMessage({ type: 'success', text: 'Penutup berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSavingSections(prev => ({ ...prev, closing: false })); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('client_token');
      if (!token) throw new Error('Not authenticated');
      const data = await InvitationAPI.saveInvitationContent({
        bride: formData.bride, groom: formData.groom, event: formData.event,
        loveStory: formData.loveStory, gallery: formData.gallery,
        weddingGift: formData.weddingGift, backgroundMusic: formData.backgroundMusic, closing: formData.closing,
      }, token);
      if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
      setMessage({ type: 'success', text: 'Data berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: '#F5F5F0' }}>Memuat data...</p>
        <style jsx>{`
          .loading-container { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:1rem; }
          .spinner { width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:#F5F5F0;border-radius:50%;animation:spin 1s linear infinite; }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>
      </div>
    );
  }



  return (
    <div className="editor-container">
      <div className="editor-header" style={{ marginBottom: '24px' }}>
        <p style={{ color: 'rgba(245, 245, 240, 0.6)', margin: 0 }}>Tambahkan cerita cinta, galeri, hadiah, dan konten tambahan undangan Anda</p>
      </div>

      {/* Banner: Data utama ada di Data Pernikahan */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '14px 18px', borderRadius: '10px',
        marginBottom: '20px',
        backgroundColor: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={18} color="#818cf8" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#e0e7ff' }}>Data Mempelai &amp; Acara</div>
            <div style={{ fontSize: '12px', color: 'rgba(245,245,240,0.5)' }}>Nama mempelai, tanggal, dan lokasi acara diisi di halaman Data Pernikahan</div>
          </div>
        </div>
        <Link href="/client-dashboard/data-pernikahan" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8',
          border: '1px solid rgba(99,102,241,0.3)',
        }}>
          Data Pernikahan <ArrowRight size={14} />
        </Link>
      </div>

      <form onSubmit={handleSave}>
        {/* Section 1: Love Story */}
        <div className="editor-card">
          <CollapsibleSection
            title="Cerita Cinta"
            icon={<Heart size={20} />}
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
            icon={<Image size={20} />}
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
            icon={<Gift size={20} />}
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
            icon={<Music size={20} />}
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
            icon={<MessageSquare size={20} />}
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

        <style jsx>{`
          .editor-container {
            max-width: 800px;
            margin: 0 auto;
          }

          .editor-card {
            background: rgba(30, 30, 30, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 1.5rem;
            transition: all 0.2s ease;
          }

          .editor-card:hover {
            border-color: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </form>
    </div>
  );
}
