/**
 * Example: How to use section hooks in a custom design
 * 
 * This file demonstrates how to create a custom wishes section
 * using the reusable useWishesData hook.
 */

'use client';

import { useWishesData } from '@/hooks/sections';

interface CustomWishesSectionProps {
    invitationSlug: string;
}

/**
 * Custom Wishes Section Example
 * 
 * This is an example of how to create a custom design for wishes section
 * using the reusable useWishesData hook.
 */
export default function CustomWishesSection({ invitationSlug }: CustomWishesSectionProps) {
    const { wishes, isLoading, totalCount, refetch } = useWishesData(invitationSlug);

    if (isLoading) {
        return (
            <section className="py-12 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <p className="text-gray-500">Memuat ucapan...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 px-6 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2
                        className="text-4xl mb-2"
                        style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 300,
                        }}
                    >
                        Ucapan & Doa
                    </h2>
                    <p className="text-sm text-gray-600 tracking-wider">
                        {totalCount} Ucapan
                    </p>
                </div>

                {/* Wishes List */}
                <div className="space-y-6">
                    {wishes.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Belum ada ucapan</p>
                        </div>
                    ) : (
                        wishes.map((wish) => (
                            <div
                                key={wish.id}
                                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                {/* Name & Attendance */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-800">
                                        {wish.name}
                                    </h3>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full ${wish.attendance === 'hadir'
                                                ? 'bg-green-100 text-green-700'
                                                : wish.attendance === 'tidak-hadir'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {wish.attendance === 'hadir' ? '✓ Hadir' :
                                            wish.attendance === 'tidak-hadir' ? '✗ Tidak Hadir' :
                                                '? Ragu-ragu'}
                                    </span>
                                </div>

                                {/* Message */}
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {wish.message}
                                </p>

                                {/* Date */}
                                <p className="text-xs text-gray-400 mt-3">
                                    {new Date(wish.createdAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Refresh Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => refetch()}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                        Muat ulang ucapan
                    </button>
                </div>
            </div>
        </section>
    );
}
