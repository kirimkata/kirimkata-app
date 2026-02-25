'use client';

import { useState, useEffect } from 'react';
import { useClient } from '@/lib/contexts/ClientContext';
import { InvitationAPI } from '@/lib/api/client';
import { ClipboardList, Send, Plus, Download, Upload, Trash2, Settings, AlertTriangle, Link as LinkIcon, Camera, Loader2, Check, X, Search, Filter, MoreHorizontal, ChevronDown, RefreshCw, Edit3, Copy, MessageCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui';

interface Guest {
    id: string;
    name: string;
    phone: string;
    sent?: boolean;
}

export default function KirimUndanganPage() {
    const { selectedEvent } = useClient();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [newGuest, setNewGuest] = useState({ name: '', phone: '' });
    const [template, setTemplate] = useState(
        'Halo {nama},\n\nKami mengundang Anda untuk hadir di acara spesial kami.\n\nSilakan buka undangan di:\n{link}\n\nTerima kasih!'
    );
    // Slug comes from the selected event context (not stale localStorage client_user.slug)
    const [clientSlug, setClientSlug] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
    const [previewGuest, setPreviewGuest] = useState<Guest | null>(null);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
    const [isGuestListOpen, setIsGuestListOpen] = useState(true);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

    // State for database persistence
    const [clientId, setClientId] = useState('');
    const [savedGuests, setSavedGuests] = useState<Guest[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State for template persistence
    const [savedTemplate, setSavedTemplate] = useState('');
    const [hasUnsavedTemplate, setHasUnsavedTemplate] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // State for snackbar notification
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    // State for confirmation modal
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } });

    // State for warning banner visibility
    const [showWarning, setShowWarning] = useState(true);


    // Sync slug from selectedEvent context (source of truth)
    useEffect(() => {
        if (selectedEvent?.slug) {
            setClientSlug(selectedEvent.slug);
        }
        setBaseUrl(window.location.origin);
    }, [selectedEvent]);

    // Load client data and guests from database
    useEffect(() => {
        const loadData = async () => {
            const user = localStorage.getItem('client_user');
            if (user) {
                const data = JSON.parse(user);
                const id = data.id || '';
                setClientId(id);

                if (id) {
                    const token = localStorage.getItem('client_token');
                    if (!token) return;

                    try {
                        // Load guests from database
                        const guestsResult = await InvitationAPI.getGuests(token);

                        if (guestsResult.success) {
                            // Check if there's unsaved data in localStorage
                            const localStorageKey = `guests_draft_${id}`;
                            const draftGuests = localStorage.getItem(localStorageKey);

                            if (draftGuests) {
                                // Use draft data from localStorage
                                const parsedDraft = JSON.parse(draftGuests);
                                setGuests(parsedDraft);
                                setSavedGuests(guestsResult.guests);
                            } else {
                                // Use data from database
                                setGuests(guestsResult.guests);
                                setSavedGuests(guestsResult.guests);
                            }
                        }
                    } catch (error) {
                        console.error('Error loading guests:', error);
                    }

                    try {
                        // Load message template from database
                        const templateResult = await InvitationAPI.getMessageTemplate(token);

                        if (templateResult.success && templateResult.template) {
                            setTemplate(templateResult.template);
                            setSavedTemplate(templateResult.template);
                        }
                    } catch (error) {
                        console.error('Error loading template:', error);
                    }
                }
            }

            setBaseUrl(window.location.origin);
        };

        loadData();
    }, []);


    // Track changes
    useEffect(() => {
        const hasChanges = JSON.stringify(guests) !== JSON.stringify(savedGuests);
        setHasUnsavedChanges(hasChanges);
    }, [guests, savedGuests]);

    // Auto-save to localStorage when there are unsaved changes
    useEffect(() => {
        if (clientId && hasUnsavedChanges) {
            const localStorageKey = `guests_draft_${clientId}`;
            localStorage.setItem(localStorageKey, JSON.stringify(guests));
        }
    }, [guests, clientId, hasUnsavedChanges]);

    // Track template changes
    useEffect(() => {
        const hasChanges = template !== savedTemplate;
        setHasUnsavedTemplate(hasChanges);
    }, [template, savedTemplate]);

    // Auto-hide warning banner after 5 seconds
    useEffect(() => {
        if (hasUnsavedChanges) {
            setShowWarning(true); // Show warning when changes detected
            const timer = setTimeout(() => {
                setShowWarning(false); // Hide after 5 seconds
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setShowWarning(true); // Reset when no changes
        }
    }, [hasUnsavedChanges]);

    // Show snackbar notification
    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => {
            setSnackbar({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Show confirmation modal
    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    const handleConfirmClose = () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => { } });
    };

    const handleConfirmAccept = () => {
        confirmModal.onConfirm();
        handleConfirmClose();
    };

    // Update guests state only (no localStorage)
    const saveGuests = (guestList: Guest[]) => {
        setGuests(guestList);
    };

    // Refresh data from database with smart merge
    const handleRefreshData = async () => {
        if (hasUnsavedChanges) {
            showConfirm(
                'Refresh & Gabung Data',
                'Anda memiliki perubahan yang belum disimpan. Data dari database akan digabungkan dengan perubahan Anda. Nama + Nomor duplikat akan digabungkan.',
                async () => {
                    await smartMergeFromDatabase();
                }
            );
        } else {
            await loadDataFromDatabase();
            showSnackbar('Data berhasil di-refresh');
        }
    };

    const loadDataFromDatabase = async () => {
        if (!clientId) return;

        const token = localStorage.getItem('client_token');
        if (!token) return;

        try {
            const guestsResult = await InvitationAPI.getGuests(token);

            if (guestsResult.success) {
                setGuests(guestsResult.guests || []);
                setSavedGuests(guestsResult.guests || []);

                // Clear localStorage draft
                const localStorageKey = `guests_draft_${clientId}`;
                localStorage.removeItem(localStorageKey);
            }
        } catch (error) {
            console.error('Error refreshing guests:', error);
            showSnackbar('Gagal refresh data', 'error');
        }
    };

    // Merge guests with duplicate detection
    const mergeGuestsWithDuplicateDetection = (dbGuests: Guest[], savedGuests: Guest[], localGuests: Guest[]) => {
        // Find local additions (not in saved)
        const localAdditions = localGuests.filter(local =>
            !savedGuests.find(saved => saved.id === local.id)
        );

        // Find local modifications (in saved but changed)
        const localModifications = localGuests.filter(local => {
            const saved = savedGuests.find(s => s.id === local.id);
            return saved && (saved.name !== local.name || saved.phone !== local.phone || saved.sent !== local.sent);
        });

        // Start with database guests
        let merged = [...dbGuests];

        // Add local additions (check for duplicates)
        let duplicates = 0;
        localAdditions.forEach(addition => {
            const isDuplicate = merged.find(g =>
                g.name.toLowerCase().trim() === addition.name.toLowerCase().trim() &&
                g.phone === addition.phone
            );

            if (!isDuplicate) {
                merged.push(addition);
            } else {
                duplicates++;
            }
        });

        // Apply local modifications
        localModifications.forEach(modified => {
            const index = merged.findIndex(g => g.id === modified.id);
            if (index !== -1) {
                merged[index] = modified;
            }
        });

        const newFromDb = dbGuests.length - savedGuests.length;

        return { merged, newFromDb: Math.max(0, newFromDb), duplicates };
    };

    // Smart merge: combine database data with local changes
    const smartMergeFromDatabase = async () => {
        if (!clientId) return;

        const token = localStorage.getItem('client_token');
        if (!token) return;

        try {
            const guestsResult = await InvitationAPI.getGuests(token);

            if (guestsResult.success) {
                const dbGuests = guestsResult.guests || [];
                const localGuests = guests;

                // Merge and detect duplicates
                const { merged, newFromDb, duplicates } = mergeGuestsWithDuplicateDetection(dbGuests, savedGuests, localGuests);

                setGuests(merged);
                setSavedGuests(dbGuests); // Update saved to match database

                // Show summary
                let message = 'Data berhasil di-merge';
                if (newFromDb > 0) message += `. ${newFromDb} tamu baru dari database`;
                if (duplicates > 0) message += `. ${duplicates} duplikat dihapus`;

                showSnackbar(message);

                // Clear localStorage draft
                const localStorageKey = `guests_draft_${clientId}`;
                localStorage.removeItem(localStorageKey);
            }
        } catch (error) {
            console.error('Error merging guests:', error);
            showSnackbar('Gagal merge data', 'error');
        }
    };


    // Save guests to database
    const handleSaveToDatabase = async () => {
        if (!clientId) return;

        const token = localStorage.getItem('client_token');
        if (!token) return;

        setIsSaving(true);
        try {
            const result = await InvitationAPI.saveGuests(guests, token);

            if (result.success) {
                setSavedGuests(guests);
                setHasUnsavedChanges(false);

                // Clear draft from localStorage after successful save
                const localStorageKey = `guests_draft_${clientId}`;
                localStorage.removeItem(localStorageKey);

                showSnackbar('Data tamu berhasil disimpan');
            } else {
                showSnackbar('Gagal menyimpan data tamu: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving guests:', error);
            showSnackbar('Gagal menyimpan data tamu', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Save template to database
    const handleSaveTemplate = async () => {
        if (!clientId) return;

        const token = localStorage.getItem('client_token');
        if (!token) return;

        setIsSavingTemplate(true);
        try {
            const result = await InvitationAPI.saveMessageTemplate(template, token);

            if (result.success) {
                setSavedTemplate(template);
                setHasUnsavedTemplate(false);
                showSnackbar('Template berhasil disimpan');
            } else {
                showSnackbar('Gagal menyimpan template: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            showSnackbar('Gagal menyimpan template', 'error');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    // Normalize WhatsApp number to international format
    const normalizeWhatsAppNumber = (phone: string): string => {
        // Remove all non-digit characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // Remove + prefix if exists
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        // If already starts with 62, return as is
        if (cleaned.startsWith('62')) {
            return cleaned;
        }

        // If starts with 0, replace with 62 (Indonesian format)
        if (cleaned.startsWith('0')) {
            return '62' + cleaned.substring(1);
        }

        // If starts with 8 (common Indonesian format without 0), add 62
        if (cleaned.startsWith('8')) {
            return '62' + cleaned;
        }

        // If starts with other country code (e.g., 64, 65, 1, etc.), keep as is
        // This handles cases like +64xxx, +1xxx, etc.
        if (cleaned.length > 0 && !cleaned.startsWith('62')) {
            // Check if it looks like a valid international number (starts with 1-9)
            if (/^[1-9]/.test(cleaned)) {
                return cleaned;
            }
        }

        // Default: assume Indonesian number, add 62
        return '62' + cleaned;
    };

    const handleAddGuest = () => {
        if (!newGuest.name.trim() || !newGuest.phone.trim()) {
            showSnackbar('Nama dan nomor HP harus diisi', 'error');
            return;
        }

        const normalizedPhone = normalizeWhatsAppNumber(newGuest.phone.trim());

        const guest: Guest = {
            id: Date.now().toString(),
            name: newGuest.name.trim(),
            phone: normalizedPhone,
            sent: false,
        };

        saveGuests([...guests, guest]);
        setNewGuest({ name: '', phone: '' });
        showSnackbar('Tamu berhasil ditambahkan');
    };

    const handleDeleteGuest = (id: string) => {
        showConfirm(
            'Hapus Tamu',
            'Apakah Anda yakin ingin menghapus tamu ini?',
            () => {
                const updatedGuests = guests.filter(g => g.id !== id);
                saveGuests(updatedGuests);
                if (previewGuest?.id === id) {
                    setPreviewGuest(null);
                }
                showSnackbar('Tamu berhasil dihapus');
            }
        );
    };

    const handleEditGuest = (guest: Guest) => {
        setEditingGuest({ ...guest });
    };

    const handleSaveEdit = () => {
        if (!editingGuest) return;

        if (!editingGuest.name.trim() || !editingGuest.phone.trim()) {
            showSnackbar('Nama dan nomor HP harus diisi', 'error');
            return;
        }

        const normalizedPhone = normalizeWhatsAppNumber(editingGuest.phone.trim());
        const updatedGuests = guests.map(g =>
            g.id === editingGuest.id
                ? { ...editingGuest, name: editingGuest.name.trim(), phone: normalizedPhone }
                : g
        );

        saveGuests(updatedGuests);

        // Update preview if editing the previewed guest
        if (previewGuest?.id === editingGuest.id) {
            setPreviewGuest({ ...editingGuest, name: editingGuest.name.trim(), phone: normalizedPhone });
        }

        setEditingGuest(null);
        showSnackbar('Tamu berhasil diupdate');
    };

    const handleCancelEdit = () => {
        setEditingGuest(null);
    };

    const handleToggleSent = (id: string) => {
        const updatedGuests = guests.map(g =>
            g.id === id ? { ...g, sent: !g.sent } : g
        );
        saveGuests(updatedGuests);
    };

    const toggleSelectGuest = (id: string) => {
        const newSelected = new Set(selectedGuests);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedGuests(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedGuests.size === guests.length) {
            setSelectedGuests(new Set());
        } else {
            setSelectedGuests(new Set(guests.map(g => g.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedGuests.size === 0) {
            showSnackbar('Pilih tamu yang ingin dihapus', 'error');
            return;
        }

        showConfirm(
            'Hapus Tamu Terpilih',
            `Apakah Anda yakin ingin menghapus ${selectedGuests.size} tamu yang dipilih?`,
            () => {
                const updatedGuests = guests.filter(g => !selectedGuests.has(g.id));
                saveGuests(updatedGuests);
                setSelectedGuests(new Set());
                setPreviewGuest(null);
                showSnackbar(`${selectedGuests.size} tamu berhasil dihapus`);
            }
        );
    };

    // Convert WhatsApp markdown to HTML for preview
    const formatWhatsAppText = (text: string): string => {
        let formatted = text;

        // Bold: *text* -> <strong>text</strong>
        formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

        // Italic: _text_ -> <em>text</em>
        formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Strikethrough: ~text~ -> <s>text</s>
        formatted = formatted.replace(/~([^~]+)~/g, '<s>$1</s>');

        // Monospace: `text` -> <code>text</code>
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Preserve line breaks
        formatted = formatted.replace(/\n/g, '<br/>');

        return formatted;
    };

    const generateMessage = (guest: Guest) => {
        const invitationLink = `${baseUrl}/${clientSlug}?to=${encodeURIComponent(guest.name)}`;
        return template
            .replace(/{nama}/g, guest.name)
            .replace(/{nomor}/g, guest.phone)
            .replace(/{link}/g, invitationLink);
    };

    const handleSendWhatsApp = (guest: Guest) => {
        const message = generateMessage(guest);
        // Phone number is already normalized, just remove any remaining non-digits
        const cleanPhone = guest.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCopyMessage = async (guest: Guest) => {
        const message = generateMessage(guest);
        try {
            await navigator.clipboard.writeText(message);
            showSnackbar('Pesan berhasil disalin ke clipboard');
        } catch (err) {
            console.error('Failed to copy:', err);
            showSnackbar('Gagal menyalin pesan', 'error');
        }
    };


    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            const importedGuests: Guest[] = jsonData.map((row, index) => {
                const rawPhone = (row['Nomor HP'] || row['nomor'] || row['phone'] || '').toString();
                return {
                    id: Date.now().toString() + index,
                    name: row['Nama'] || row['nama'] || '',
                    phone: normalizeWhatsAppNumber(rawPhone),
                    sent: false,
                };
            }).filter(g => g.name && g.phone);

            if (importedGuests.length > 0) {
                saveGuests([...guests, ...importedGuests]);
                showSnackbar(`Berhasil import ${importedGuests.length} tamu`);
            } else {
                showSnackbar('Tidak ada data valid di file Excel', 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const handleExportGuests = () => {
        if (guests.length === 0) {
            alert('Belum ada tamu untuk di-export');
            return;
        }

        const exportData = guests.map((guest, index) => ({
            'No': index + 1,
            'Nama': guest.name,
            'Nomor HP': guest.phone,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Tamu');
        XLSX.writeFile(workbook, 'daftar-tamu.xlsx');
    };

    const handleExportTemplate = () => {
        const templateData = [
            { 'Nama': 'Nama Tamu 1', 'Nomor HP': '628123456789' },
            { 'Nama': 'Nama Tamu 2', 'Nomor HP': '628987654321' },
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'template-tamu.xlsx');
    };

    return (
        <>
            <div className="page-container">

                {!clientSlug ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        margin: '0 0.5rem',
                    }}>
                        <div className="empty-state-icon">
                            <ClipboardList size={48} className="text-gray-400" />
                        </div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '0.5rem',
                        }}>
                            Belum Ada Undangan
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            maxWidth: '400px',
                            margin: '0 auto',
                            lineHeight: 1.6,
                        }}>
                            Akun Anda belum memiliki undangan yang ditugaskan.
                            Silakan hubungi admin untuk mendapatkan akses ke undangan.
                        </p>
                    </div>
                ) : (
                    <div className="content-grid">
                        {/* Left Column */}
                        <div className="left-column">
                            {/* Add Guest Form */}
                            <div className="card add-guest-card">
                                <div className="card-header collapsible" onClick={() => setIsAddGuestOpen(!isAddGuestOpen)}>
                                    <h2>Tambah Tamu</h2>
                                    <ChevronDown className={`chevron ${isAddGuestOpen ? 'open' : ''}`} size={20} />
                                </div>
                                <div className={`collapsible-content ${isAddGuestOpen ? 'open' : ''}`}>
                                    <div className="add-guest-form">
                                        <input
                                            type="text"
                                            placeholder="Nama Tamu"
                                            value={newGuest.name}
                                            onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                                        />
                                        <div className="phone-input-group">
                                            <input
                                                type="tel"
                                                placeholder="Nomor HP"
                                                value={newGuest.phone}
                                                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                                            />
                                            <button onClick={handleAddGuest} className="btn-add">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Guest Table */}
                            <div className="card guest-list-card">
                                <div className="card-header collapsible" onClick={() => setIsGuestListOpen(!isGuestListOpen)}>
                                    <h2>Daftar Tamu ({guests.length})</h2>
                                    <ChevronDown className={`chevron ${isGuestListOpen ? 'open' : ''}`} size={20} />
                                </div>
                                <div className={`collapsible-content ${isGuestListOpen ? 'open' : ''}`}>
                                    <div className="table-header">
                                        <div className="table-actions">
                                            <button
                                                onClick={handleBulkDelete}
                                                disabled={selectedGuests.size === 0}
                                                className="btn-delete"
                                                title={selectedGuests.size > 0 ? `Hapus ${selectedGuests.size} tamu` : 'Pilih tamu untuk dihapus'}
                                                style={{
                                                    backgroundColor: selectedGuests.size > 0 ? '#dc2626' : '#9ca3af',
                                                    cursor: selectedGuests.size > 0 ? 'pointer' : 'not-allowed',
                                                    opacity: selectedGuests.size > 0 ? 1 : 0.6,
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                {selectedGuests.size > 0 && selectedGuests.size}
                                            </button>
                                            <label className="btn-import">
                                                <Upload className="btn-icon" size={16} />
                                                <span className="btn-text">Import</span>
                                                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                                            </label>
                                            <button onClick={handleExportGuests} disabled={guests.length === 0} className="btn-export">
                                                <Download className="btn-icon" size={16} />
                                                <span className="btn-text">Export</span>
                                            </button>
                                            <button onClick={handleExportTemplate} className="btn-template">Template</button>
                                            {/* <button onClick={handleExportTemplate} className="btn-template">
                                                <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="12" y1="18" x2="12" y2="12"></line>
                                                    <line x1="9" y1="15" x2="15" y2="15"></line>
                                                </svg>
                                                <span className="btn-text">Template</span>
                                            </button> */}
                                            <button
                                                onClick={handleSaveToDatabase}
                                                disabled={!hasUnsavedChanges || isSaving}
                                                className="btn-save"
                                                style={{
                                                    marginLeft: 'auto',
                                                    backgroundColor: hasUnsavedChanges ? '#10b981' : '#9ca3af',
                                                    cursor: hasUnsavedChanges && !isSaving ? 'pointer' : 'not-allowed',
                                                    opacity: hasUnsavedChanges && !isSaving ? 1 : 0.6,
                                                }}
                                            >
                                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                            <button onClick={handleRefreshData} className="btn-refresh" title="Refresh data dari database">
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warning Banner */}
                                    {hasUnsavedChanges && showWarning && (
                                        <div className="warning-banner">
                                            <AlertTriangle size={20} />
                                            <span>Anda memiliki perubahan yang belum disimpan. Klik <strong>Simpan</strong> untuk menyimpan perubahan Anda.</span>
                                        </div>
                                    )}

                                    {guests.length === 0 ? (
                                        <p className="empty-state">Belum ada tamu. Tambahkan tamu di atas atau import dari Excel.</p>
                                    ) : (
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th className="col-checkbox">
                                                            <input type="checkbox" checked={guests.length > 0 && selectedGuests.size === guests.length} onChange={toggleSelectAll} />
                                                        </th>
                                                        <th className="col-no">No</th>
                                                        <th>Nama</th>
                                                        <th className="col-phone">Nomor HP</th>
                                                        <th className="col-sent">Terkirim</th>
                                                        <th className="col-actions">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {guests.map((guest, index) => {
                                                        const isEditing = editingGuest?.id === guest.id;

                                                        return (
                                                            <tr
                                                                key={guest.id}
                                                                className={`${selectedGuests.has(guest.id) ? 'selected' : ''} ${previewGuest?.id === guest.id ? 'preview' : ''} ${isEditing ? 'editing' : ''}`}
                                                                onClick={(e) => {
                                                                    if (!isEditing && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                                                                        setPreviewGuest(guest);
                                                                        setIsTemplateOpen(true);
                                                                    }
                                                                }}
                                                            >
                                                                <td className="col-checkbox">
                                                                    <input type="checkbox" checked={selectedGuests.has(guest.id)} onChange={() => toggleSelectGuest(guest.id)} onClick={(e) => e.stopPropagation()} disabled={isEditing} />
                                                                </td>
                                                                <td className="col-no">{index + 1}</td>
                                                                <td>
                                                                    {isEditing ? (
                                                                        <div className="edit-inputs-container">
                                                                            <input
                                                                                type="text"
                                                                                value={editingGuest.name}
                                                                                onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                                                                                className="edit-input"
                                                                                placeholder="Nama"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                            <input
                                                                                type="tel"
                                                                                value={editingGuest.phone}
                                                                                onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                                                                                className="edit-input edit-input-phone-mobile"
                                                                                placeholder="Nomor HP"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="guest-name">{guest.name}</div>
                                                                            <div className="guest-phone-mobile">{guest.phone}</div>
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td className="col-phone">
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="tel"
                                                                            value={editingGuest.phone}
                                                                            onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                                                                            className="edit-input"
                                                                            placeholder="Nomor HP"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    ) : (
                                                                        guest.phone
                                                                    )}
                                                                </td>
                                                                <td className="col-sent">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={guest.sent || false}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleSent(guest.id);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        disabled={isEditing}
                                                                        className="sent-checkbox"
                                                                    />
                                                                </td>
                                                                <td className="col-actions">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="btn-action btn-save" title="Simpan">
                                                                                <Check size={14} />
                                                                            </button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="btn-action btn-cancel" title="Batal">
                                                                                <X size={14} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleEditGuest(guest); }} className="btn-action btn-edit btn-square" title="Edit">
                                                                                <Edit3 size={16} />
                                                                            </button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleCopyMessage(guest); }} className="btn-action btn-copy btn-square" title="Copy Pesan">
                                                                                <Copy size={16} />
                                                                            </button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(guest); }} className="btn-action btn-wa btn-square" title="Kirim WhatsApp">
                                                                                <MessageCircle size={16} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Template */}
                        <div className="right-column">
                            <div className="card template-card">
                                <div className="card-header collapsible" onClick={() => setIsTemplateOpen(!isTemplateOpen)}>
                                    <h2>Template Pesan</h2>
                                    <ChevronDown className={`chevron ${isTemplateOpen ? 'open' : ''}`} size={20} />
                                </div>
                                <div className={`collapsible-content ${isTemplateOpen ? 'open' : ''}`}>
                                    <div className="template-content-wrapper">
                                        <div className="template-info">
                                            <strong>Variabel yang tersedia:</strong><br />
                                            <code>{'{nama}'}</code> - Nama tamu<br />
                                            <code>{'{nomor}'}</code> - Nomor HP tamu<br />
                                            <code>{'{link}'}</code> - Link undangan
                                        </div>

                                        <div className="formatting-info">
                                            <strong>Format WhatsApp:</strong><br />
                                            <code>*bold*</code> untuk <strong>tebal</strong> •
                                            <code>_italic_</code> untuk <em>miring</em> •
                                            <code>~strikethrough~</code> untuk <s>coret</s> •
                                            <code>`monospace`</code> untuk <code>monospace</code>
                                        </div>

                                        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={10} />

                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={!hasUnsavedTemplate || isSavingTemplate}
                                            style={{
                                                marginTop: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                backgroundColor: hasUnsavedTemplate ? '#10b981' : '#9ca3af',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                cursor: hasUnsavedTemplate && !isSavingTemplate ? 'pointer' : 'not-allowed',
                                                opacity: hasUnsavedTemplate && !isSavingTemplate ? 1 : 0.6,
                                                width: '100%',
                                            }}
                                        >
                                            {isSavingTemplate ? 'Menyimpan Template...' : 'Simpan Template'}
                                        </button>

                                        {previewGuest && (
                                            <div className="preview-section">
                                                <h3>Preview untuk: {previewGuest.name}</h3>
                                                <div
                                                    className="preview-message"
                                                    dangerouslySetInnerHTML={{ __html: formatWhatsAppText(generateMessage(previewGuest)) }}
                                                />
                                                <div className="preview-actions">
                                                    <button onClick={() => handleCopyMessage(previewGuest)} className="btn-copy-preview">
                                                        <Copy size={18} />
                                                        Copy Pesan
                                                    </button>
                                                    <button onClick={() => handleSendWhatsApp(previewGuest)} className="btn-send-preview">
                                                        <MessageCircle size={18} />
                                                        Kirim ke Nama Terpilih
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!previewGuest && guests.length > 0 && (
                                            <div className="hint">💡 Klik pada baris tamu untuk melihat preview pesan</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Snackbar Notification */}
            {snackbar.show && (
                <div className={`snackbar ${snackbar.type}`}>
                    {snackbar.type === 'success' ? '✓' : '✗'} {snackbar.message}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal-overlay" onClick={handleConfirmClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">{confirmModal.title}</h3>
                        <p className="modal-message">{confirmModal.message}</p>
                        <div className="modal-actions">
                            <button onClick={handleConfirmClose} className="btn-modal-cancel">
                                Batal
                            </button>
                            <button onClick={handleConfirmAccept} className="btn-modal-confirm">
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-container {
                    max-width: 100%;
                    padding: 0;
                    min-height: 100%;
                }

                .content-grid {
                    padding: 0 0rem;
                    padding-bottom: 2rem;
                }

                .card {
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    margin-bottom: 0.75rem;
                    overflow: hidden;
                }

                .card-header {
                    padding: 0.5rem 0.5rem;
                    background: #f9fafb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 36px;
                }

                .card-header.collapsible {
                    cursor: pointer;
                }

                .card-header h2 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0;
                    color: #111827;
                    line-height: 1.2;
                }

                .chevron {
                    transition: transform 0.2s;
                }

                .chevron.open {
                    transform: rotate(180deg);
                }

                .collapsible-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }

                .collapsible-content.open {
                    max-height: 5000px;
                }

                .add-guest-form {
                    padding: 0.5rem 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .add-guest-form input {
                    padding: 0.5rem 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    height: 2.5rem;
                }

                .phone-input-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .phone-input-group input {
                    flex: 1;
                }

                .btn-add {
                    padding: 0.5rem 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1.25rem;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .table-header {
                    padding: 0.5rem 0.5rem;
                    padding-bottom: 0.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .table-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .table-actions button, .table-actions label {
                    padding: 0.375rem 0.75rem;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .btn-delete { background: #dc2626; }
                .btn-import { background: #10b981; }
                .btn-export { background: #3b82f6; }

                .btn-refresh {
                    padding: 0.375rem 0.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .btn-refresh:hover {
                    background: #2563eb;
                }

                .warning-banner {
                    margin: 0.75rem 0.5rem;
                    padding: 0.75rem 1rem;
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 0.375rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                    color: #92400e;
                }

                .warning-banner svg {
                    flex-shrink: 0;
                    stroke: #f59e0b;
                }

                .warning-banner strong {
                    font-weight: 600;
                    color: #78350f;
                }
                .btn-export:disabled { background: #9ca3af; cursor: not-allowed; }
                .btn-template { background: #6b7280; }

                .empty-state {
                    color: #6b7280;
                    text-align: center;
                    padding: 2rem;
                    font-size: 0.875rem;
                }

                .table-container {
                    overflow-x: auto;
                    max-height: 500px;
                    overflow-y: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                thead {
                    background: #f9fafb;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }

                th {
                    padding: 0.5rem;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.75rem;
                }

                .col-checkbox { text-align: center; width: 40px; }
                .col-no { width: 35px; }
                .col-sent { text-align: center; width: 60px; }
                .col-actions { text-align: center; width: 120px; }

                tbody tr {
                    border-top: 1px solid #e5e7eb;
                    cursor: pointer;
                }

                tbody tr.selected {
                    background: #eff6ff;
                }

                tbody tr.preview td {
                    font-weight: 600;
                }

                tbody tr.editing {
                    background: #fef3c7;
                }

                .edit-input {
                    width: 100%;
                    padding: 0.375rem 0.5rem;
                    border: 1px solid #3b82f6;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-family: 'Segoe UI', sans-serif;
                }

                .edit-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }

                .edit-inputs-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                }

                .edit-input-phone-mobile {
                    display: none;
                }

                td.col-actions {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                }

                .btn-action {
                    padding: 0.25rem 0.5rem;
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-edit {
                    background: #3b82f6;
                }

                .btn-edit:hover {
                    background: #2563eb;
                }

                .btn-save {
                    background: #10b981;
                }

                .btn-save:hover {
                    background: #059669;
                }

                .btn-cancel {
                    background: #6b7280;
                    margin-right: 0;
                }

                .btn-cancel:hover {
                    background: #4b5563;
                }

                td {
                    padding: 0.5rem;
                    font-size: 0.875rem;
                }

                .col-no { color: #6b7280; font-size: 0.75rem; }
                .col-phone { color: #6b7280; font-size: 0.75rem; }

                .guest-phone-mobile {
                    display: none;
                    font-size: 0.7rem;
                    color: #6b7280;
                    margin-top: 0.125rem;
                }

                .sent-checkbox {
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                }

                .btn-wa {
                    padding: 0.25rem 0.5rem;
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #25D366;
                }

                .btn-square {
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                }

                .btn-copy {
                    background: #6b7280;
                }

                .btn-copy:hover {
                    background: #4b5563;
                }

                .template-info {
                    padding: 0.5rem;
                    background: #eff6ff;
                    border-radius: 0.375rem;
                    margin-bottom: 0.5rem;
                    font-size: 0.75rem;
                    color: #1e40af;
                }

                .formatting-info {
                    padding: 0.5rem;
                    background: #f0fdf4;
                    border-radius: 0.375rem;
                    margin-bottom: 0.5rem;
                    font-size: 0.75rem;
                    color: #166534;
                    line-height: 1.6;
                }

                .formatting-info code {
                    background: #dcfce7;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.7rem;
                }

                .template-card textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
                    font-size: 0.75rem;
                    resize: vertical;
                }

                .template-content-wrapper {
                    padding: 0.5rem 0.5rem;
                }

                .preview-section {
                    margin-top: 1rem;
                }

                .preview-section h3 {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #111827;
                }

                .preview-message {
                    padding: 0.75rem;
                    background: #f9fafb;
                    border-radius: 0.375rem;
                    border: 1px solid #e5e7eb;
                    white-space: pre-wrap;
                    font-size: 0.75rem;
                    color: #374151;
                    line-height: 1.6;
                }

                .preview-message strong {
                    font-weight: 700;
                    color: #111827;
                }

                .preview-message em {
                    font-style: italic;
                }

                .preview-message s {
                    text-decoration: line-through;
                    opacity: 0.7;
                }

                .preview-message code {
                    background: #e5e7eb;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                }

                .preview-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }

                .btn-copy-preview {
                    flex: 1;
                    padding: 0.5rem;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: background 0.2s;
                }

                .btn-copy-preview:hover {
                    background: #4b5563;
                }

                .btn-send-preview {
                    flex: 2;
                    padding: 0.5rem;
                    background: #25D366;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: background 0.2s;
                }

                .btn-send-preview:hover {
                    background: #128C7E;
                }

                .hint {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #fef3c7;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    color: #92400e;
                    text-align: center;
                }

                /* Mobile: Single column, collapsible */
                @media (max-width: 767px) {
                    /* Reorder sections: Template (1) → Add Guest (2) → Guest List (3) */
                    .content-grid {
                        display: flex;
                        flex-direction: column;
                    }

                    .right-column {
                        order: 1; /* Template Pesan first */
                    }

                    .left-column .add-guest-card {
                        order: 2; /* Tambah Tamu second */
                    }

                    .left-column .guest-list-card {
                        order: 3; /* Daftar Tamu third */
                    }

                    .add-guest-card .card-header,
                    .template-card .card-header,
                    .guest-list-card .card-header {
                        display: flex;
                    }

                    .add-guest-card .collapsible-content,
                    .guest-list-card .collapsible-content {
                        padding: 0;
                    }

                    .template-card .collapsible-content {
                        padding: 0;
                    }

                    .col-phone {
                        display: none;
                    }

                    .guest-phone-mobile {
                        display: block;
                    }

                    .edit-input-phone-mobile {
                        display: block;
                    }

                    /* Mobile: Hide button text, show only icons */
                    .table-actions .btn-text {
                        display: none;
                    }

                    .table-actions button,
                    .table-actions label {
                        padding: 0.5rem;
                        min-width: 36px;
                        justify-content: center;
                    }

                    .table-actions .btn-icon {
                        margin: 0;
                    }

                    /* Make buttons white flat icons on mobile */
                    .btn-import,
                    .btn-export,
                    .btn-template {
                        background: transparent !important;
                        border: 1px solid #e5e7eb;
                    }

                    .btn-import svg,
                    .btn-export svg,
                    .btn-template svg {
                        stroke: white;
                    }

                    .btn-import {
                        background: #10b981 !important;
                    }

                    .btn-export {
                        background: #3b82f6 !important;
                    }

                    .btn-export:disabled {
                        background: #9ca3af !important;
                        opacity: 0.5;
                    }

                    .btn-template {
                        background: #6b7280 !important;
                    }
                }

                /* Desktop: 2 columns, always visible */
                @media (min-width: 768px) {
                    .content-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1.5rem;
                    }

                    .add-guest-card {
                        padding: 1rem;
                    }

                    .add-guest-card .card-header {
                        display: none;
                    }

                    .add-guest-card .collapsible-content {
                        max-height: none;
                        padding: 0;
                    }

                    .add-guest-form {
                        flex-direction: row;
                        padding: 0;
                    }

                    .phone-input-group {
                        flex: 1;
                    }

                    .template-card .card-header {
                        display: none;
                    }

                    .template-card .collapsible-content {
                        max-height: none;
                        padding: 0;
                    }

                    /* Guest List always visible on desktop */
                    .guest-list-card .card-header {
                        display: none;
                    }

                    .guest-list-card .collapsible-content {
                        max-height: none;
                        padding: 0;
                    }

                    .guest-list-card {
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 180px);
                        max-height: calc(100vh - 180px);
                    }

                    .guest-list-card .collapsible-content {
                        flex: 1;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                    }

                    .guest-list-card .table-container {
                        flex: 1;
                        overflow-y: auto;
                        max-height: none;
                    }
                }

                /* Snackbar Notification */
                .snackbar {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    background: #10b981;
                    color: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-size: 0.875rem;
                    font-weight: 500;
                    z-index: 9999;
                    animation: slideIn 0.3s ease-out, slideOut 0.3s ease-in 2.7s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .snackbar.error {
                    background: #ef4444;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }

                /* Confirmation Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease-out;
                }

                .modal-content {
                    background: white;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    animation: scaleIn 0.2s ease-out;
                }

                .modal-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0 0 0.75rem 0;
                }

                .modal-message {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0 0 1.5rem 0;
                    line-height: 1.5;
                }

                .modal-actions {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                }

                .btn-modal-cancel,
                .btn-modal-confirm {
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-modal-cancel {
                    background: #f3f4f6;
                    color: #374151;
                }

                .btn-modal-cancel:hover {
                    background: #e5e7eb;
                }

                .btn-modal-confirm {
                    background: #ef4444;
                    color: white;
                }

                .btn-modal-confirm:hover {
                    background: #dc2626;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}
