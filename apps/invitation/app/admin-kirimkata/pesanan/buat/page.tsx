'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InvitationAPI } from '@/lib/api/client';

interface Template {
    id: number;
    name: string;
    slug: string;
    category: string;
    basePrice: number;
    description?: string;
    previewImage?: string;
    isActive: boolean;
}

interface Addon {
    id: number;
    name: string;
    slug: string;
    category: string;
    price: number;
    description?: string;
    isActive: boolean;
}

interface OrderFormData {
    templateId: number | null;
    templateName: string;
    type: string;
    title: string;
    slug: string;
    mainDate: string;
    inviterType: 'couple' | 'single' | 'family';
    inviterData: {
        bride?: { fullName: string; nickname: string; parent: string };
        groom?: { fullName: string; nickname: string; parent: string };
        singleName?: string;
        familyName?: string;
    };
    addonIds: number[];
    selectedAddons: Addon[];
}

export default function CreateOrderPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<OrderFormData>({
        templateId: null,
        templateName: '',
        type: 'wedding',
        title: '',
        slug: '',
        mainDate: '',
        inviterType: 'couple',
        inviterData: {
            bride: { fullName: '', nickname: '', parent: '' },
            groom: { fullName: '', nickname: '', parent: '' },
        },
        addonIds: [],
        selectedAddons: [],
    });

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    // Load addons when moving to step 3
    useEffect(() => {
        if (currentStep === 3 && addons.length === 0) {
            loadAddons();
        }
    }, [currentStep]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';
            const response = await InvitationAPI.getTemplates(token, { active: true });

            if (response.success) {
                setTemplates(response.data);
            } else {
                setError('Gagal memuat template');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat template');
        } finally {
            setLoading(false);
        }
    };

    const loadAddons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';
            const response = await InvitationAPI.getAddons(token, { active: true });

            if (response.success) {
                setAddons(response.data);
            } else {
                setError('Gagal memuat add-ons');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat add-ons');
        } finally {
            setLoading(false);
        }
    };

    const selectTemplate = (template: Template) => {
        setFormData({
            ...formData,
            templateId: template.id,
            templateName: template.name,
        });
        setCurrentStep(2);
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.slug || !formData.mainDate) {
            setError('Mohon lengkapi semua field yang wajib');
            return;
        }

        setError('');
        setCurrentStep(3);
    };

    const toggleAddon = (addon: Addon) => {
        const isSelected = formData.addonIds.includes(addon.id);

        if (isSelected) {
            setFormData({
                ...formData,
                addonIds: formData.addonIds.filter(id => id !== addon.id),
                selectedAddons: formData.selectedAddons.filter(a => a.id !== addon.id),
            });
        } else {
            setFormData({
                ...formData,
                addonIds: [...formData.addonIds, addon.id],
                selectedAddons: [...formData.selectedAddons, addon],
            });
        }
    };

    const calculateTotal = () => {
        const selectedTemplate = templates.find(t => t.id === formData.templateId);
        const templatePrice = selectedTemplate?.basePrice || 0;
        const addonsTotal = formData.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        return templatePrice + addonsTotal;
    };

    const submitOrder = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token') || '';

            const orderData = {
                type: formData.type,
                title: formData.title,
                slug: formData.slug,
                mainDate: formData.mainDate,
                inviterType: formData.inviterType,
                inviterData: formData.inviterData,
                templateId: formData.templateId!,
                addonIds: formData.addonIds,
            };

            const response = await InvitationAPI.createOrder(orderData, token);

            if (response.success) {
                // Redirect to order details
                router.push(`/admin-kirimkata/pesanan/${response.data.order.id}`);
            } else {
                setError(response.error || 'Gagal membuat pesanan');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat membuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-300 text-gray-600'
                                        }`}
                                >
                                    {step}
                                </div>
                                {step < 4 && (
                                    <div
                                        className={`w-16 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-2 text-sm text-gray-600">
                        {currentStep === 1 && 'Pilih Template'}
                        {currentStep === 2 && 'Informasi Dasar'}
                        {currentStep === 3 && 'Pilih Add-ons'}
                        {currentStep === 4 && 'Review & Submit'}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Step 1: Template Selection */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Pilih Template Undangan</h2>
                        {loading ? (
                            <div className="text-center py-12">Loading...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => selectTemplate(template)}
                                    >
                                        {template.previewImage && (
                                            <img
                                                src={template.previewImage}
                                                alt={template.name}
                                                className="w-full h-48 object-cover"
                                            />
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                                            <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-600 font-bold">
                                                    Rp {template.basePrice.toLocaleString('id-ID')}
                                                </span>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                    Pilih
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Basic Information */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Informasi Dasar</h2>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <form onSubmit={handleStep2Submit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Judul Acara *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Contoh: Pernikahan Budi & Ani"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Slug (URL

                                        ) *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="contoh: budi-ani-2024"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        URL undangan: {window.location.origin}/{formData.slug || 'slug-anda'}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Tanggal Acara *</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={formData.mainDate}
                                        onChange={(e) => setFormData({ ...formData, mainDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Tipe Pengundang *</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={formData.inviterType}
                                        onChange={(e) => setFormData({ ...formData, inviterType: e.target.value as any })}
                                    >
                                        <option value="couple">Pasangan (Mempelai)</option>
                                        <option value="single">Individu</option>
                                        <option value="family">Keluarga</option>
                                    </select>
                                </div>

                                {formData.inviterType === 'couple' && (
                                    <div className="space-y-4 mb-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Mempelai Wanita</h4>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg mb-2"
                                                placeholder="Nama Lengkap"
                                                value={formData.inviterData.bride?.fullName || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        bride: { ...formData.inviterData.bride!, fullName: e.target.value }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg mb-2"
                                                placeholder="Nama Panggilan"
                                                value={formData.inviterData.bride?.nickname || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        bride: { ...formData.inviterData.bride!, nickname: e.target.value }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg"
                                                placeholder="Putri dari Bapak/Ibu..."
                                                value={formData.inviterData.bride?.parent || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        bride: { ...formData.inviterData.bride!, parent: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Mempelai Pria</h4>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg mb-2"
                                                placeholder="Nama Lengkap"
                                                value={formData.inviterData.groom?.fullName || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        groom: { ...formData.inviterData.groom!, fullName: e.target.value }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg mb-2"
                                                placeholder="Nama Panggilan"
                                                value={formData.inviterData.groom?.nickname || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        groom: { ...formData.inviterData.groom!, nickname: e.target.value }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded-lg"
                                                placeholder="Putra dari Bapak/Ibu..."
                                                value={formData.inviterData.groom?.parent || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inviterData: {
                                                        ...formData.inviterData,
                                                        groom: { ...formData.inviterData.groom!, parent: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Lanjut
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Step 3: Add-ons Selection */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Pilih Add-ons (Opsional)</h2>
                        {loading ? (
                            <div className="text-center py-12">Loading...</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {addons.map((addon) => (
                                        <div
                                            key={addon.id}
                                            className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 ${formData.addonIds.includes(addon.id)
                                                    ? 'border-blue-600'
                                                    : 'border-transparent'
                                                }`}
                                            onClick={() => toggleAddon(addon)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold">{addon.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-blue-600">
                                                        Rp {addon.price.toLocaleString('id-ID')}
                                                    </p>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.addonIds.includes(addon.id)}
                                                        onChange={() => toggleAddon(addon)}
                                                        className="mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(4)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Lanjut ke Review
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 4 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Review Pesanan</h2>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Template</h3>
                                    <p>{formData.templateName}</p>
                                    <p className="text-blue-600">
                                        Rp {templates.find(t => t.id === formData.templateId)?.basePrice.toLocaleString('id-ID')}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Informasi Acara</h3>
                                    <p><strong>Judul:</strong> {formData.title}</p>
                                    <p><strong>Slug:</strong> {formData.slug}</p>
                                    <p><strong>Tanggal:</strong> {new Date(formData.mainDate).toLocaleDateString('id-ID')}</p>
                                </div>

                                {formData.addonIds.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Add-ons</h3>
                                        {formData.selectedAddons.map(addon => (
                                            <div key={addon.id} className="flex justify-between">
                                                <span>{addon.name}</span>
                                                <span className="text-blue-600">Rp {addon.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Kembali
                                </button>
                                <button
                                    onClick={submitOrder}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Memproses...' : 'Buat Pesanan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
