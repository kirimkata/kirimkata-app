'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackButtonClick } from '@/lib/services/analytics';

export default function NotFound() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
                padding: '2rem',
                fontFamily: 'Segoe UI, sans-serif',
            }}
        >
            {/* Modal */}
            {isModalOpen && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 50,
                            backdropFilter: 'blur(4px)',
                        }}
                    />
                    {/* Modal Content */}
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '90%',
                            zIndex: 51,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                Informasi
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '0',
                                    lineHeight: 1,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                            Sorry, This page under development. Please contact admin KirimKata for Other Information :)
                        </p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                            <a
                                href="https://wa.me/6285780205096?text=Halo%2C%20saya%20ingin%20informasi%20tentang%20katalog%20undangan"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackButtonClick('hubungi_admin_modal', '404_page', 'Hubungi Admin')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #0891b2)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #06b6d4)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                Hubungi Admin
                            </a>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'white',
                                    color: '#6b7280',
                                    fontWeight: 600,
                                    borderRadius: '0.5rem',
                                    border: '2px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <div
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                {/* Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(to bottom right, #2563eb, #06b6d4)',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>K</span>
                        </div>
                        <span
                            style={{
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                fontWeight: 'bold',
                                color: '#1f2937',
                            }}
                        >
                            KirimKata
                        </span>
                    </div>
                </div>

                {/* 404 Illustration */}
                <div
                    style={{
                        fontSize: 'clamp(6rem, 20vw, 10rem)',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1,
                        marginBottom: '1.5rem',
                    }}
                >
                    404
                </div>

                {/* Message */}
                <h1
                    style={{
                        fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '1rem',
                    }}
                >
                    Halaman Tidak Ditemukan
                </h1>
                <p
                    style={{
                        fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                        color: '#6b7280',
                        marginBottom: '2.5rem',
                        lineHeight: 1.6,
                    }}
                >
                    Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau
                    URL yang Anda masukkan salah.
                </p>

                {/* Buttons */}
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <Link
                        href="/"
                        onClick={() => trackButtonClick('kembali_beranda', '404_page', 'Kembali ke Beranda')}
                        style={{
                            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                            background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s',
                            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #0891b2)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #06b6d4)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        Kembali ke Beranda
                    </Link>
                </div>

                {/* Additional Help */}
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                        Butuh bantuan?
                    </p>
                    <a
                        href="https://wa.me/6285780205096?text=Halo%2C%20saya%20butuh%20bantuan"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackButtonClick('hubungi_wa_404', '404_page', 'Hubungi Kami via WhatsApp')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}
                    >
                        <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Hubungi Kami via WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}
