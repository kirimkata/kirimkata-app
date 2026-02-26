'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/lib/contexts/ClientContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
  Heart, Image, Gift, Music, MessageSquare,
  Save, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, ClipboardList, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { FormField, TextInput, Button } from '@/components/ui';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// ========================
// Types
// ========================

interface BankOption {
  id: number;
  name: string;
  code: string | null;
  logoUrl: string | null;
}

interface LoveStoryBlock {
  title: string;
  body_text: string;
  display_order: number;
}

interface LoveStoryData {
  is_enabled: boolean;
  main_title: string;
  background_image_url: string;
  blocks: LoveStoryBlock[];
}

interface GalleryData {
  is_enabled: boolean;
  main_title: string;
  images: string[];
  youtube_embed_url: string;
  show_youtube: boolean;
}

interface WeddingGiftData {
  is_enabled: boolean;
  title: string;
  subtitle: string;
  button_label: string;
  show_physical_gift: boolean;
  bank_accounts: { bank_name: string; account_number: string; account_holder_name: string; display_order: number }[];
  recipient_name: string;
  recipient_phone: string;
  recipient_address_line1: string;
}

interface MusicData {
  is_enabled: boolean;
  audio_url: string;
  title: string;
  artist: string;
  loop: boolean;
}

interface ClosingData {
  is_enabled: boolean;
  names_display: string;
  message_line1: string;
  message_line2: string;
  message_line3: string;
  photo_url: string;
}

type SectionKey = 'loveStory' | 'gallery' | 'weddingGift' | 'music' | 'closing';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// ========================
// Custom Bank Select with Logo Preview
// ========================

function BankSelect({
  value, onChange, bankList, disabled, colors,
}: {
  value: string;
  onChange: (name: string) => void;
  bankList: BankOption[];
  disabled: boolean;
  colors: { border: string; background: string; text: string; textSecondary: string; card: string; hover: string };
}) {
  const [open, setOpen] = useState(false);
  const selected = bankList.find(b => b.name === value);

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 14px', borderRadius: '8px',
          border: `1px solid ${open ? '#6366f1' : colors.border}`,
          backgroundColor: colors.background, color: colors.text,
          fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {selected?.logoUrl
          ? <img src={selected.logoUrl} alt={selected.name} style={{ width: 28, height: 20, objectFit: 'contain', flexShrink: 0, borderRadius: '3px' }} />
          : <div style={{ width: 28, height: 20, borderRadius: '3px', backgroundColor: 'rgba(99,102,241,0.15)', flexShrink: 0 }} />
        }
        <span style={{ flex: 1 }}>{value || '-- Pilih Bank --'}</span>
        <span style={{ color: colors.textSecondary, fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          maxHeight: '260px', overflowY: 'auto',
          padding: '4px',
        }}>
          {/* Deselect option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '7px', border: 'none',
              backgroundColor: 'transparent', color: colors.textSecondary,
              fontSize: '13px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            -- Pilih Bank --
          </button>
          {bankList.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => { onChange(b.name); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '7px', border: 'none',
                backgroundColor: value === b.name ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: value === b.name ? '#6366f1' : colors.text,
                fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                fontWeight: value === b.name ? 600 : 400,
              }}
            >
              {b.logoUrl
                ? <img src={b.logoUrl} alt={b.name} style={{ width: 32, height: 22, objectFit: 'contain', flexShrink: 0, borderRadius: '3px' }} />
                : <div style={{ width: 32, height: 22, borderRadius: '3px', backgroundColor: 'rgba(99,102,241,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6366f1', fontWeight: 700 }}>
                  {b.code ?? b.name.slice(0, 3)}
                </div>
              }
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Click-outside to close */}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

// ========================
// Collapsible Section Header
// ========================

function SectionHeader({
  title, icon, isOpen, onToggle,
  isEnabled, onToggleEnable,
  saveStatus, onSave,
  saving,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isEnabled: boolean;
  onToggleEnable: () => void;
  saveStatus: SaveStatus;
  onSave: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} onClick={onToggle}>
        <span style={{ color: isEnabled ? colors.primary : colors.textSecondary }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: isEnabled ? colors.text : colors.textSecondary }}>
          {title}
        </span>
        {!isEnabled && (
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(156,163,175,0.15)', color: colors.textSecondary, fontWeight: 600 }}>
            NONAKTIF
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Toggle on/off */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleEnable(); }}
          title={isEnabled ? 'Nonaktifkan section ini' : 'Aktifkan section ini'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          {isEnabled
            ? <ToggleRight size={24} color="#6366f1" />
            : <ToggleLeft size={24} color={colors.textSecondary} />
          }
        </button>

        {/* Save button */}
        {isOpen && isEnabled && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              border: 'none', opacity: saving ? 0.7 : 1,
              backgroundColor: saveStatus === 'success' ? '#22c55e'
                : saveStatus === 'error' ? '#ef4444'
                  : '#6366f1',
              color: '#fff',
            }}
          >
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : saveStatus === 'success' ? <CheckCircle size={14} />
                : saveStatus === 'error' ? <AlertCircle size={14} />
                  : <Save size={14} />}
            {saving ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : saveStatus === 'error' ? 'Gagal' : 'Simpan'}
          </button>
        )}

        {/* Expand/collapse arrow */}
        <span onClick={onToggle} style={{ cursor: 'pointer', color: colors.textSecondary }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>
    </div>
  );
}

// ========================
// Main Page
// ========================

export default function EditUndanganPage() {
  const { selectedEvent, isLoading: clientLoading } = useClient();
  const { colors } = useTheme();
  const router = useRouter();

  const slug = selectedEvent?.slug;

  // Open/close state
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    loveStory: true, gallery: false, weddingGift: false, music: false, closing: false,
  });

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<Record<SectionKey, boolean>>({
    loveStory: false, gallery: false, weddingGift: false, music: false, closing: false,
  });
  const [saveStatus, setSaveStatus] = useState<Record<SectionKey, SaveStatus>>({
    loveStory: 'idle', gallery: 'idle', weddingGift: 'idle', music: 'idle', closing: 'idle',
  });

  // Section data
  const [loveStory, setLoveStory] = useState<LoveStoryData>({
    is_enabled: true, main_title: 'Our Love Story', background_image_url: '', blocks: [],
  });
  const [gallery, setGallery] = useState<GalleryData>({
    is_enabled: true, main_title: 'Our Moments', images: [], youtube_embed_url: '', show_youtube: false,
  });
  const [weddingGift, setWeddingGift] = useState<WeddingGiftData>({
    is_enabled: true, title: 'Wedding Gift', subtitle: '', button_label: 'Kirim Hadiah',
    show_physical_gift: false,
    bank_accounts: [], recipient_name: '', recipient_phone: '', recipient_address_line1: '',
  });
  const [music, setMusic] = useState<MusicData>({
    is_enabled: true, audio_url: '', title: '', artist: '', loop: true,
  });
  const [closing, setClosing] = useState<ClosingData>({
    is_enabled: true, names_display: '', message_line1: '', message_line2: '', message_line3: '', photo_url: '',
  });
  const [bankList, setBankList] = useState<BankOption[]>([]);

  const authHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('client_token') : '';
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  // Fetch bank list from DB (public endpoint — no auth needed)
  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/banks`)
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data)) setBankList(d.data); })
      .catch(() => { }); // silently fail — dropdown falls back gracefully
  }, []);

  const fetchAll = useCallback(async () => {
    if (!slug) return;
    setPageLoading(true);
    try {
      const [lsRes, galRes, gifRes, musRes, clsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/invitations/${slug}/love-story`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/v1/invitations/${slug}/gallery`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/v1/invitations/${slug}/wedding-gift`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/v1/invitations/${slug}/music`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/v1/invitations/${slug}/closing`, { headers: authHeaders() }),
      ]);

      const [lsData, galData, gifData, musData, clsData] = await Promise.all([
        lsRes.json(), galRes.json(), gifRes.json(), musRes.json(), clsRes.json(),
      ]);

      if (lsData?.data) {
        const s = lsData.data.settings;
        if (s) setLoveStory(prev => ({
          ...prev,
          is_enabled: s.is_enabled ?? true,
          main_title: s.main_title || prev.main_title,
          background_image_url: s.background_image_url || '',
          blocks: lsData.data.blocks || [],
        }));
      }

      if (galData?.data) {
        const s = galData.data.settings;
        if (s) setGallery(prev => ({
          ...prev,
          is_enabled: s.is_enabled ?? true,
          main_title: s.main_title || prev.main_title,
          images: s.images || [],
          youtube_embed_url: s.youtube_embed_url || '',
          show_youtube: s.show_youtube ?? false,
        }));
      }

      if (gifData?.data) {
        const s = gifData.data.settings;
        if (s) setWeddingGift(prev => ({
          ...prev,
          is_enabled: s.is_enabled ?? true,
          title: s.title || prev.title,
          subtitle: s.subtitle || '',
          button_label: s.button_label || prev.button_label,
          recipient_name: s.recipient_name || '',
          recipient_phone: s.recipient_phone || '',
          recipient_address_line1: s.recipient_address_line1 || '',
          bank_accounts: gifData.data.bankAccounts || [],
        }));
      }

      if (musData?.data) {
        const s = musData.data.settings;
        if (s) setMusic(prev => ({
          ...prev,
          is_enabled: s.is_enabled ?? true,
          audio_url: s.audio_url || '',
          title: s.title || '',
          artist: s.artist || '',
          loop: s.loop ?? true,
        }));
      }

      if (clsData?.data) {
        const s = clsData.data.settings;
        if (s) setClosing(prev => ({
          ...prev,
          is_enabled: s.is_enabled ?? true,
          names_display: s.names_display || '',
          message_line1: s.message_line1 || '',
          message_line2: s.message_line2 || '',
          message_line3: s.message_line3 || '',
          photo_url: s.photo_url || '',
        }));
      }
    } catch (e) {
      console.error('Failed to fetch invitation sections:', e);
    } finally {
      setPageLoading(false);
    }
  }, [slug, authHeaders]);

  useEffect(() => {
    if (!clientLoading && !selectedEvent) {
      router.push('/client-dashboard/invitations');
    }
  }, [clientLoading, selectedEvent, router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const setSectionSaveStatus = (section: SectionKey, status: SaveStatus) => {
    setSaveStatus(prev => ({ ...prev, [section]: status }));
    if (status === 'success' || status === 'error') {
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [section]: 'idle' })), 2500);
    }
  };

  // ====== SAVE HANDLERS ======

  const saveLoveStory = async () => {
    if (!slug) return;
    setSavingSection(prev => ({ ...prev, loveStory: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/love-story`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: {
            main_title: loveStory.main_title,
            background_image_url: loveStory.background_image_url,
            is_enabled: loveStory.is_enabled,
          },
          blocks: loveStory.blocks,
        }),
      });
      const data = await res.json();
      setSectionSaveStatus('loveStory', data.success ? 'success' : 'error');
    } catch { setSectionSaveStatus('loveStory', 'error'); }
    finally { setSavingSection(prev => ({ ...prev, loveStory: false })); }
  };

  const saveGallery = async () => {
    if (!slug) return;
    setSavingSection(prev => ({ ...prev, gallery: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/gallery`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: {
            main_title: gallery.main_title,
            images: gallery.images,
            youtube_embed_url: gallery.youtube_embed_url,
            show_youtube: gallery.show_youtube,
            is_enabled: gallery.is_enabled,
          },
        }),
      });
      const data = await res.json();
      setSectionSaveStatus('gallery', data.success ? 'success' : 'error');
    } catch { setSectionSaveStatus('gallery', 'error'); }
    finally { setSavingSection(prev => ({ ...prev, gallery: false })); }
  };

  const saveWeddingGift = async () => {
    if (!slug) return;
    setSavingSection(prev => ({ ...prev, weddingGift: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/wedding-gift`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: {
            title: weddingGift.title,
            subtitle: weddingGift.subtitle,
            button_label: weddingGift.button_label,
            recipient_name: weddingGift.recipient_name,
            recipient_phone: weddingGift.recipient_phone,
            recipient_address_line1: weddingGift.recipient_address_line1,
            is_enabled: weddingGift.is_enabled,
          },
          bankAccounts: weddingGift.bank_accounts,
        }),
      });
      const data = await res.json();
      setSectionSaveStatus('weddingGift', data.success ? 'success' : 'error');
    } catch { setSectionSaveStatus('weddingGift', 'error'); }
    finally { setSavingSection(prev => ({ ...prev, weddingGift: false })); }
  };

  const saveMusic = async () => {
    if (!slug) return;
    setSavingSection(prev => ({ ...prev, music: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/music`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: {
            audio_url: music.audio_url,
            title: music.title,
            artist: music.artist,
            loop: music.loop,
            is_enabled: music.is_enabled,
          },
        }),
      });
      const data = await res.json();
      setSectionSaveStatus('music', data.success ? 'success' : 'error');
    } catch { setSectionSaveStatus('music', 'error'); }
    finally { setSavingSection(prev => ({ ...prev, music: false })); }
  };

  const saveClosing = async () => {
    if (!slug) return;
    setSavingSection(prev => ({ ...prev, closing: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/closing`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: {
            names_display: closing.names_display,
            message_line1: closing.message_line1,
            message_line2: closing.message_line2,
            message_line3: closing.message_line3,
            photo_url: closing.photo_url,
            is_enabled: closing.is_enabled,
          },
        }),
      });
      const data = await res.json();
      setSectionSaveStatus('closing', data.success ? 'success' : 'error');
    } catch { setSectionSaveStatus('closing', 'error'); }
    finally { setSavingSection(prev => ({ ...prev, closing: false })); }
  };

  const toggleSection = (key: SectionKey) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ====== UI HELPERS ======

  const card: React.CSSProperties = {
    backgroundColor: colors.sidebar,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    marginBottom: '16px',
    overflow: 'hidden',
  };

  const sectionBody: React.CSSProperties = {
    padding: '20px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  };

  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <FormField label={label}>{children}</FormField>
  );

  if (clientLoading || pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader size={32} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, margin: 0 }}>Edit Undangan</h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '6px' }}>
          Aktifkan dan isi konten tambahan undangan Anda. Toggle untuk menyalakan/mematikan section.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px',
        backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={18} color="#818cf8" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: colors.text }}>Data Mempelai & Acara</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>Nama mempelai, tanggal, dan lokasi diisi di halaman Data Pernikahan</div>
          </div>
        </div>
        <Link href="/client-dashboard/data-pernikahan" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8',
          border: '1px solid rgba(99,102,241,0.25)',
        }}>
          Data Pernikahan <ArrowRight size={14} />
        </Link>
      </div>

      {/* ====== CERITA CINTA ====== */}
      <div style={card}>
        <SectionHeader
          title="Cerita Cinta" icon={<Heart size={20} />}
          isOpen={openSections.loveStory} onToggle={() => toggleSection('loveStory')}
          isEnabled={loveStory.is_enabled}
          onToggleEnable={() => setLoveStory(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
          saveStatus={saveStatus.loveStory} onSave={saveLoveStory} saving={savingSection.loveStory}
        />
        {openSections.loveStory && (
          <div style={sectionBody}>
            <F label="Judul Utama">
              <TextInput value={loveStory.main_title} onChange={e => setLoveStory(p => ({ ...p, main_title: e.target.value }))} disabled={!loveStory.is_enabled} />
            </F>
            <F label="Background Image URL">
              <TextInput value={loveStory.background_image_url} onChange={e => setLoveStory(p => ({ ...p, background_image_url: e.target.value }))} placeholder="https://..." disabled={!loveStory.is_enabled} />
            </F>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: colors.textSecondary, marginBottom: '10px' }}>BLOK CERITA ({loveStory.blocks.length} blok)</div>
              {loveStory.blocks.map((block, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '10px', backgroundColor: colors.background }}>
                  <div style={row2}>
                    <F label={`Judul Blok ${i + 1}`}>
                      <TextInput value={block.title} disabled={!loveStory.is_enabled} onChange={e => {
                        const blocks = [...loveStory.blocks];
                        blocks[i] = { ...blocks[i], title: e.target.value };
                        setLoveStory(p => ({ ...p, blocks }));
                      }} />
                    </F>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button variant="secondary" size="sm" onClick={() => {
                        setLoveStory(p => ({ ...p, blocks: p.blocks.filter((_, idx) => idx !== i) }));
                      }} disabled={!loveStory.is_enabled}>Hapus</Button>
                    </div>
                  </div>
                  <F label="Isi Cerita">
                    <textarea rows={3} disabled={!loveStory.is_enabled} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.text, fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', opacity: !loveStory.is_enabled ? 0.5 : 1 }}
                      value={block.body_text} onChange={e => {
                        const blocks = [...loveStory.blocks];
                        blocks[i] = { ...blocks[i], body_text: e.target.value };
                        setLoveStory(p => ({ ...p, blocks }));
                      }} />
                  </F>
                </div>
              ))}
              <Button variant="secondary" size="sm" disabled={!loveStory.is_enabled} onClick={() => {
                setLoveStory(p => ({ ...p, blocks: [...p.blocks, { title: '', body_text: '', display_order: p.blocks.length + 1 }] }));
              }}>+ Tambah Blok Cerita</Button>
            </div>
          </div>
        )}
      </div>

      {/* ====== GALERI FOTO ====== */}
      <div style={card}>
        <SectionHeader
          title="Galeri Foto" icon={<Image size={20} />}
          isOpen={openSections.gallery} onToggle={() => toggleSection('gallery')}
          isEnabled={gallery.is_enabled}
          onToggleEnable={() => setGallery(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
          saveStatus={saveStatus.gallery} onSave={saveGallery} saving={savingSection.gallery}
        />
        {openSections.gallery && (
          <div style={sectionBody}>
            <F label="Judul Galeri">
              <TextInput value={gallery.main_title} onChange={e => setGallery(p => ({ ...p, main_title: e.target.value }))} disabled={!gallery.is_enabled} />
            </F>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: colors.textSecondary, marginBottom: '10px' }}>URL FOTO ({gallery.images.length} foto)</div>
              {gallery.images.map((img, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <TextInput value={img} disabled={!gallery.is_enabled} placeholder={`URL Foto ${i + 1}`} onChange={e => {
                      const images = [...gallery.images];
                      images[i] = e.target.value;
                      setGallery(p => ({ ...p, images }));
                    }} />
                  </div>
                  <Button variant="secondary" size="sm" disabled={!gallery.is_enabled} onClick={() => setGallery(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}>✕</Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" disabled={!gallery.is_enabled} onClick={() => setGallery(p => ({ ...p, images: [...p.images, ''] }))}>+ Tambah Foto</Button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: gallery.is_enabled ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={gallery.show_youtube} disabled={!gallery.is_enabled}
                onChange={e => setGallery(p => ({ ...p, show_youtube: e.target.checked }))} />
              <span style={{ fontSize: '14px', color: colors.text }}>Tampilkan video YouTube</span>
            </label>
            {gallery.show_youtube && (
              <F label="YouTube Embed URL">
                <TextInput value={gallery.youtube_embed_url} onChange={e => setGallery(p => ({ ...p, youtube_embed_url: e.target.value }))} placeholder="https://youtube.com/embed/..." disabled={!gallery.is_enabled} />
              </F>
            )}
          </div>
        )}
      </div>

      {/* ====== HADIAH PERNIKAHAN ====== */}
      <div style={card}>
        <SectionHeader
          title="Hadiah Pernikahan" icon={<Gift size={20} />}
          isOpen={openSections.weddingGift} onToggle={() => toggleSection('weddingGift')}
          isEnabled={weddingGift.is_enabled}
          onToggleEnable={() => setWeddingGift(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
          saveStatus={saveStatus.weddingGift} onSave={saveWeddingGift} saving={savingSection.weddingGift}
        />
        {openSections.weddingGift && (
          <div style={sectionBody}>
            <div style={row2}>
              <F label="Judul"><TextInput value={weddingGift.title} onChange={e => setWeddingGift(p => ({ ...p, title: e.target.value }))} disabled={!weddingGift.is_enabled} /></F>
              <F label="Label Tombol"><TextInput value={weddingGift.button_label} onChange={e => setWeddingGift(p => ({ ...p, button_label: e.target.value }))} disabled={!weddingGift.is_enabled} /></F>
            </div>
            <F label="Subjudul"><TextInput value={weddingGift.subtitle} onChange={e => setWeddingGift(p => ({ ...p, subtitle: e.target.value }))} disabled={!weddingGift.is_enabled} /></F>
            {/* ---- Hadiah Fisik Sub-toggle ---- */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: weddingGift.show_physical_gift ? 'rgba(99,102,241,0.06)' : 'transparent',
              marginTop: '4px',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Hadiah Fisik</div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Aktifkan jika ingin menerima hadiah fisik/barang</div>
              </div>
              <button
                onClick={() => setWeddingGift(p => ({ ...p, show_physical_gift: !p.show_physical_gift }))}
                disabled={!weddingGift.is_enabled}
                style={{ background: 'none', border: 'none', cursor: weddingGift.is_enabled ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}
              >
                {weddingGift.show_physical_gift
                  ? <ToggleRight size={26} color="#6366f1" />
                  : <ToggleLeft size={26} color={colors.textSecondary} />
                }
              </button>
            </div>
            {weddingGift.show_physical_gift && weddingGift.is_enabled && (
              <div style={{ padding: '14px', borderRadius: '8px', border: `1px solid rgba(99,102,241,0.2)`, backgroundColor: 'rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={row2}>
                  <F label="Nama Penerima"><TextInput value={weddingGift.recipient_name} onChange={e => setWeddingGift(p => ({ ...p, recipient_name: e.target.value }))} /></F>
                  <F label="No. Telepon"><TextInput value={weddingGift.recipient_phone} onChange={e => setWeddingGift(p => ({ ...p, recipient_phone: e.target.value }))} /></F>
                </div>
                <F label="Alamat Pengiriman"><TextInput value={weddingGift.recipient_address_line1} onChange={e => setWeddingGift(p => ({ ...p, recipient_address_line1: e.target.value }))} /></F>
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>TRANSFER BANK ({weddingGift.bank_accounts.length} rekening)</div>
            {weddingGift.bank_accounts.map((acc, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.background }}>
                <div style={row2}>
                  <F label="Bank">
                    <BankSelect
                      value={acc.bank_name}
                      disabled={!weddingGift.is_enabled}
                      bankList={bankList}
                      colors={colors}
                      onChange={(name) => {
                        const bank_accounts = [...weddingGift.bank_accounts];
                        bank_accounts[i] = { ...bank_accounts[i], bank_name: name };
                        setWeddingGift(p => ({ ...p, bank_accounts }));
                      }}
                    />
                  </F>
                  <F label="No. Rekening"><TextInput value={acc.account_number} disabled={!weddingGift.is_enabled} onChange={e => {
                    const bank_accounts = [...weddingGift.bank_accounts];
                    bank_accounts[i] = { ...bank_accounts[i], account_number: e.target.value };
                    setWeddingGift(p => ({ ...p, bank_accounts }));
                  }} /></F>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <F label="Nama Pemilik Rekening"><TextInput value={acc.account_holder_name} disabled={!weddingGift.is_enabled} onChange={e => {
                      const bank_accounts = [...weddingGift.bank_accounts];
                      bank_accounts[i] = { ...bank_accounts[i], account_holder_name: e.target.value };
                      setWeddingGift(p => ({ ...p, bank_accounts }));
                    }} /></F>
                  </div>
                  <Button variant="secondary" size="sm" disabled={!weddingGift.is_enabled} onClick={() => setWeddingGift(p => ({ ...p, bank_accounts: p.bank_accounts.filter((_, idx) => idx !== i) }))}>Hapus</Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" disabled={!weddingGift.is_enabled} onClick={() => setWeddingGift(p => ({ ...p, bank_accounts: [...p.bank_accounts, { bank_name: '', account_number: '', account_holder_name: '', display_order: p.bank_accounts.length + 1 }] }))}>+ Tambah Rekening</Button>
          </div>
        )}
      </div>

      {/* ====== MUSIK LATAR ====== */}
      <div style={card}>
        <SectionHeader
          title="Musik Latar" icon={<Music size={20} />}
          isOpen={openSections.music} onToggle={() => toggleSection('music')}
          isEnabled={music.is_enabled}
          onToggleEnable={() => setMusic(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
          saveStatus={saveStatus.music} onSave={saveMusic} saving={savingSection.music}
        />
        {openSections.music && (
          <div style={sectionBody}>
            <F label="URL Audio (mp3)">
              <TextInput value={music.audio_url} onChange={e => setMusic(p => ({ ...p, audio_url: e.target.value }))} placeholder="https://..." disabled={!music.is_enabled} />
            </F>
            <div style={row2}>
              <F label="Judul Lagu"><TextInput value={music.title} onChange={e => setMusic(p => ({ ...p, title: e.target.value }))} disabled={!music.is_enabled} /></F>
              <F label="Artis"><TextInput value={music.artist} onChange={e => setMusic(p => ({ ...p, artist: e.target.value }))} disabled={!music.is_enabled} /></F>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: music.is_enabled ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={music.loop} disabled={!music.is_enabled}
                onChange={e => setMusic(p => ({ ...p, loop: e.target.checked }))} />
              <span style={{ fontSize: '14px', color: colors.text }}>Loop musik (putar otomatis berulang)</span>
            </label>
          </div>
        )}
      </div>

      {/* ====== PENUTUP ====== */}
      <div style={card}>
        <SectionHeader
          title="Penutup" icon={<MessageSquare size={20} />}
          isOpen={openSections.closing} onToggle={() => toggleSection('closing')}
          isEnabled={closing.is_enabled}
          onToggleEnable={() => setClosing(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
          saveStatus={saveStatus.closing} onSave={saveClosing} saving={savingSection.closing}
        />
        {openSections.closing && (
          <div style={sectionBody}>
            <F label="Nama Tampilan (e.g. Budi & Ani)">
              <TextInput value={closing.names_display} onChange={e => setClosing(p => ({ ...p, names_display: e.target.value }))} disabled={!closing.is_enabled} />
            </F>
            <F label="URL Foto Penutup">
              <TextInput value={closing.photo_url} onChange={e => setClosing(p => ({ ...p, photo_url: e.target.value }))} placeholder="https://..." disabled={!closing.is_enabled} />
            </F>
            <F label="Pesan Baris 1">
              <TextInput value={closing.message_line1} onChange={e => setClosing(p => ({ ...p, message_line1: e.target.value }))} disabled={!closing.is_enabled} />
            </F>
            <F label="Pesan Baris 2">
              <TextInput value={closing.message_line2} onChange={e => setClosing(p => ({ ...p, message_line2: e.target.value }))} disabled={!closing.is_enabled} />
            </F>
            <F label="Pesan Baris 3">
              <TextInput value={closing.message_line3} onChange={e => setClosing(p => ({ ...p, message_line3: e.target.value }))} disabled={!closing.is_enabled} />
            </F>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
