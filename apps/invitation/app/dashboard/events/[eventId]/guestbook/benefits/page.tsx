'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface BenefitCatalog {
  id: string;
  benefit_type: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

interface GuestType {
  id: string;
  type_name: string;
  display_name: string;
  color_code: string;
}

interface GuestTypeBenefit {
  id: string;
  guest_type_id: string;
  benefit_type: string;
  quantity: number;
  description?: string;
  is_active: boolean;
}

interface BenefitMatrix {
  guest_types: Array<{
    id: string;
    type_name: string;
    display_name: string;
    color_code: string;
    benefits: GuestTypeBenefit[];
  }>;
  all_benefits: BenefitCatalog[];
}

export default function BenefitsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [matrix, setMatrix] = useState<BenefitMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<BenefitCatalog | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    benefit_type: '',
    display_name: '',
    description: '',
    icon: '🎁',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMatrix();
  }, [eventId]);

  const fetchMatrix = async () => {
    const token = localStorage.getItem('client_token');
    
    try {
      const res = await fetch(`/api/guestbook/benefits/matrix?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMatrix(data.data);
      }
    } catch (error) {
      console.error('Error fetching matrix:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBenefit = async (guestTypeId: string, benefitType: string) => {
    const token = localStorage.getItem('client_token');
    
    // Check if benefit is already assigned
    const guestType = matrix?.guest_types.find(gt => gt.id === guestTypeId);
    const existingBenefit = guestType?.benefits.find(b => b.benefit_type === benefitType);

    try {
      if (existingBenefit) {
        // Remove benefit
        const res = await fetch(`/api/guestbook/benefits/${existingBenefit.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          await fetchMatrix();
        }
      } else {
        // Add benefit
        const res = await fetch('/api/guestbook/benefits/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            guest_type_id: guestTypeId,
            benefit_type: benefitType,
            quantity: 1,
          }),
        });

        if (res.ok) {
          await fetchMatrix();
        }
      }
    } catch (error) {
      console.error('Error toggling benefit:', error);
    }
  };

  const handleOpenBenefitModal = (benefit?: BenefitCatalog) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setBenefitForm({
        benefit_type: benefit.benefit_type,
        display_name: benefit.display_name,
        description: benefit.description || '',
        icon: benefit.icon || '🎁',
      });
    } else {
      setEditingBenefit(null);
      setBenefitForm({
        benefit_type: '',
        display_name: '',
        description: '',
        icon: '🎁',
      });
    }
    setError('');
    setShowBenefitModal(true);
  };

  const handleSubmitBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch('/api/guestbook/benefits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(benefitForm),
      });

      const data = await res.json();

      if (data.success) {
        await fetchMatrix();
        setShowBenefitModal(false);
      } else {
        setError(data.error || 'Failed to save benefit');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonIcons = ['🎁', '🍽️', '👑', '🅿️', '⚡', '🥤', '📸', '🎒', '🎫', '🎉', '💐', '🍰'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benefits Management</h1>
          <p className="text-gray-600 mt-2">Assign benefits to guest types</p>
        </div>
        <button
          onClick={() => handleOpenBenefitModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Benefit
        </button>
      </div>

      {/* Benefit Matrix */}
      {matrix && matrix.guest_types.length > 0 && matrix.all_benefits.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Guest Type
                  </th>
                  {matrix.all_benefits.map((benefit) => (
                    <th key={benefit.id} className="px-6 py-4 text-center text-sm font-semibold text-gray-900 min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{benefit.icon}</span>
                        <span>{benefit.display_name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matrix.guest_types.map((guestType) => (
                  <tr key={guestType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 sticky left-0 bg-white z-10">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: guestType.color_code }}
                        ></div>
                        <span className="font-medium text-gray-900">{guestType.display_name}</span>
                      </div>
                    </td>
                    {matrix.all_benefits.map((benefit) => {
                      const hasBenefit = guestType.benefits.some(
                        (b) => b.benefit_type === benefit.benefit_type && b.is_active
                      );
                      
                      return (
                        <td key={benefit.id} className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleBenefit(guestType.id, benefit.benefit_type)}
                            className={`w-10 h-10 rounded-lg border-2 transition ${
                              hasBenefit
                                ? 'bg-green-500 border-green-600 text-white'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {hasBenefit && (
                              <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No benefits or guest types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create guest types and benefits first to manage benefit assignments.
          </p>
        </div>
      )}

      {/* Legend */}
      {matrix && matrix.guest_types.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on a checkbox to assign/remove a benefit to/from a guest type</li>
            <li>• Green checkmark = Benefit is assigned</li>
            <li>• Empty box = Benefit is not assigned</li>
          </ul>
        </div>
      )}

      {/* Add Benefit Modal */}
      {showBenefitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Benefit</h2>
              <button
                onClick={() => setShowBenefitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmitBenefit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefit Type (Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={benefitForm.benefit_type}
                  onChange={(e) => setBenefitForm({ ...benefitForm, benefit_type: e.target.value })}
                  placeholder="e.g., souvenir, snack, parking"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (e.g., souvenir, vip_lounge)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={benefitForm.display_name}
                  onChange={(e) => setBenefitForm({ ...benefitForm, display_name: e.target.value })}
                  placeholder="e.g., Souvenir, VIP Lounge Access"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={benefitForm.description}
                  onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  placeholder="Brief description of the benefit"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setBenefitForm({ ...benefitForm, icon })}
                      className={`h-10 text-2xl rounded-lg border-2 transition ${
                        benefitForm.icon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={benefitForm.icon}
                  onChange={(e) => setBenefitForm({ ...benefitForm, icon: e.target.value })}
                  placeholder="Or enter custom emoji"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBenefitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
