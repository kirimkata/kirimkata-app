import React from 'react';

export function InvitationLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
            <div className="text-center">
                <div className="relative inline-block">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-400"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <svg
                            className="w-8 h-8 text-rose-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                        </svg>
                    </div>
                </div>
                <p className="mt-6 text-gray-600 font-medium">Memuat undangan...</p>
                <p className="mt-2 text-sm text-gray-400">Mohon tunggu sebentar</p>
            </div>
        </div>
    );
}
