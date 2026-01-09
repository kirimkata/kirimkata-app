'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackButtonClick } from '@/lib/services/analytics';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      data-page="landing"
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
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
                onClick={() => trackButtonClick('hubungi_admin_modal_landing', 'landing_page', 'Hubungi Admin')}
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

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(to bottom right, #3b82f6, #3b82f6)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>K</span>
            </div>
            <span style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              KirimKata
            </span>
          </div>

          {/* Desktop Buttons - Hidden on mobile */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.75rem',
          }}
            className="desktop-buttons"
          >
            <Link
              href="/client-dashboard/login"
              onClick={() => trackButtonClick('masuk_header', 'landing_page', 'Masuk')}
              style={{
                padding: '0.625rem 1.5rem',
                color: '#2563eb',
                fontWeight: 500,
                borderRadius: '0.5rem',
                border: '2px solid #2563eb',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                fontFamily: 'Segoe UI, sans-serif',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Masuk
            </Link>
            <a
              href="https://wa.me/6285780205096?text=Halo%2C%20saya%20ingin%20membuat%20undangan%20website"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick('buat_undangan_header', 'landing_page', 'Buat Undangan')}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                color: 'white',
                fontWeight: 500,
                borderRadius: '0.5rem',
                textDecoration: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                fontFamily: 'Segoe UI, sans-serif',
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
              Buat Undangan
            </a>
          </div>

          {/* Hamburger Menu - Visible on mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '40px',
              height: '40px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              position: 'relative',
              zIndex: 60,
            }}
            className="hamburger-button"
            aria-label="Menu"
          >
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1f2937',
              transition: 'all 0.3s',
              transform: isMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none',
            }}></span>
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1f2937',
              marginTop: '5px',
              transition: 'all 0.3s',
              opacity: isMenuOpen ? 0 : 1,
            }}></span>
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1f2937',
              marginTop: '5px',
              transition: 'all 0.3s',
              transform: isMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
            }}></span>
          </button>

        </div>
      </header>

      {/* Mobile Menu Overlay - Outside header to cover entire page */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 55,
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isMenuOpen ? 0 : '-100%',
        width: '280px',
        maxWidth: '80vw',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
        transition: 'right 0.3s ease-in-out',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        padding: '5rem 2rem 2rem',
        gap: '1rem',
      }}>
        <Link
          href="/client-dashboard/login"
          onClick={() => {
            trackButtonClick('masuk_mobile', 'landing_page', 'Masuk');
            setIsMenuOpen(false);
          }}
          style={{
            padding: '1rem 1.5rem',
            color: '#2563eb',
            fontWeight: 500,
            borderRadius: '0.5rem',
            border: '2px solid #2563eb',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'background-color 0.2s',
            fontFamily: 'Segoe UI, sans-serif',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Masuk
        </Link>
        <a
          href="https://wa.me/6285780205096?text=Halo%2C%20saya%20ingin%20membuat%20undangan%20website"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackButtonClick('buat_undangan_mobile', 'landing_page', 'Buat Undangan');
            setIsMenuOpen(false);
          }}
          style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(to right, #2563eb, #06b6d4)',
            color: 'white',
            fontWeight: 500,
            borderRadius: '0.5rem',
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
            display: 'block',
            fontFamily: 'Segoe UI, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #0891b2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #06b6d4)';
          }}
        >
          Buat Undangan
        </a>
      </div>

      {/* CSS for responsive behavior */}
      <style jsx>{`
        @media (min-width: 640px) {
          .desktop-buttons {
            display: flex !important;
          }
          .hamburger-button {
            display: none !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <main style={{
        paddingTop: 'clamp(6rem, 15vh, 8rem)',
        paddingBottom: 'clamp(3rem, 10vh, 5rem)',
        paddingLeft: 'clamp(1rem, 5vw, 1.5rem)',
        paddingRight: 'clamp(1rem, 5vw, 1.5rem)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '3rem',
          alignItems: 'center',
        }}>
          {/* Left Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            width: '100%',
            maxWidth: '600px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h1 style={{
                fontSize: 'clamp(1rem, 8vw, 3.75rem)',
                fontWeight: 'bold',
                color: '#111827',
                lineHeight: 1.2,
                margin: 0,
                fontFamily: 'Segoe UI, sans-serif',
              }}>
                Undangan 3D Interaktif
                <br />
                <span style={{
                  background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  borderTop: '2rem',
                }}>
                  Buat Tamu Terpukau Sejak Klik Pertama.
                </span>
              </h1>
              <p style={{
                fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                color: '#4b5563',
                lineHeight: 1.75,
                margin: '0 auto',
                maxWidth: '36rem',
                fontFamily: 'Segoe UI, sans-serif',
              }}>
                Hadirkan pengalaman undangan yang berkelas, modern, dan tak terlupakan.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => {
                  trackButtonClick('lihat_katalog_hero', 'landing_page', 'Lihat Katalog');
                  setIsModalOpen(true);
                }}
                style={{
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                  backgroundColor: 'white',
                  color: '#2563eb',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  border: '2px solid #2563eb',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Segoe UI, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                Lihat Katalog
              </button>
            </div>
          </div>

          {/* Right Content - Phone Mockups */}
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Container with fixed aspect ratio that scales */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
              transform: 'scale(clamp(0.5, 1.5vw + 0.5, 1))',
              transformOrigin: 'center',
            }}>
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom right, rgba(96, 165, 250, 0.2), rgba(34, 211, 238, 0.2))',
                borderRadius: '9999px',
                filter: 'blur(64px)',
              }}></div>

              {/* Phone mockups container - FIXED SIZE */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '2rem 0',
              }}>
                {/* Left Phone - FIXED 256px width */}
                <div style={{
                  position: 'relative',
                  width: '256px', // Fixed width
                  height: '520px', // Fixed height
                  backgroundColor: 'black',
                  borderRadius: '3rem',
                  padding: '0.75rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transform: 'rotate(-6deg)',
                  transition: 'transform 0.3s',
                  flexShrink: 0, // Prevent shrinking
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-6deg)'}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2.5rem',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom right, #fce7f3, #dbeafe)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Wedding Invitation</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'serif', color: '#1f2937' }}>Wedding</div>
                        <div style={{ fontSize: '1.125rem', color: '#374151' }}>Selina & Joko</div>
                      </div>
                    </div>
                  </div>
                  {/* Notch */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8rem',
                    height: '1.75rem',
                    backgroundColor: 'black',
                    borderBottomLeftRadius: '1.5rem',
                    borderBottomRightRadius: '1.5rem',
                  }}></div>
                </div>

                {/* Right Phone - FIXED 256px width */}
                <div style={{
                  position: 'relative',
                  width: '256px', // Fixed width
                  height: '520px', // Fixed height
                  backgroundColor: 'black',
                  borderRadius: '3rem',
                  padding: '0.75rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transform: 'rotate(6deg)',
                  transition: 'transform 0.3s',
                  flexShrink: 0, // Prevent shrinking
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(6deg)'}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2.5rem',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom right, #fef3c7, #fecaca)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Birthday Invitation</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'serif', color: '#1f2937' }}>Birthday</div>
                        <div style={{ fontSize: '1.125rem', color: '#374151' }}>Sweet 17th</div>
                      </div>
                    </div>
                  </div>
                  {/* Notch */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8rem',
                    height: '1.75rem',
                    backgroundColor: 'black',
                    borderBottomLeftRadius: '1.5rem',
                    borderBottomRightRadius: '1.5rem',
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section style={{
          marginTop: '6rem',
          paddingTop: '4rem',
          paddingBottom: '4rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#111827',
            fontFamily: 'Segoe UI, sans-serif',
          }}>
            Kamu punya pertanyaan?
            <br />
            <span style={{ color: '#2563eb' }}>Konsultasi gratis dengan kami!</span>
          </h2>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
          }}>
            <a
              href="https://wa.me/6285780205096?text=Halo%2C%20saya%20ingin%20konsultasi%20tentang%20undangan%20website"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick('konsultasi_gratis', 'landing_page', 'Konsultasi Gratis')}
              style={{
                padding: '1rem 2.5rem',
                background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                color: 'white',
                fontWeight: 600,
                borderRadius: '0.5rem',
                textDecoration: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                display: 'inline-block',
                fontFamily: 'Segoe UI, sans-serif',
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
              Konsultasi Gratis
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        paddingTop: '3rem',
        paddingBottom: '2rem',
        marginTop: '4rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingLeft: 'clamp(1rem, 5vw, 1.5rem)',
          paddingRight: 'clamp(1rem, 5vw, 1.5rem)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}>
            {/* Company Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(to bottom right, #3b82f6, #3b82f6)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>K</span>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Segoe UI, sans-serif' }}>KirimKata</span>
              </div>
              <p style={{ color: '#9ca3af', lineHeight: 1.6, margin: 0, fontFamily: 'Segoe UI, sans-serif' }}>
                Jakarta, Indonesia.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '1rem',
                marginTop: 0,
                fontFamily: 'Segoe UI, sans-serif',
              }}>
                Hubungi Kami
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                color: '#9ca3af',
              }}>
                <a
                  href="mailto:info.kirimkata@gmail.com"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontFamily: 'Segoe UI, sans-serif',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#22d3ee'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  info.kirimkata@gmail.com
                </a>
                <a
                  href="https://wa.me/6285780205096"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontFamily: 'Segoe UI, sans-serif',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#22d3ee'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  085780205096
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '1rem',
                marginTop: 0,
                fontFamily: 'Segoe UI, sans-serif',
              }}>
                Ikuti Kami
              </h3>
              <a
                href="https://instagram.com/kirimkata_invitation"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#9ca3af',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  fontFamily: 'Segoe UI, sans-serif',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#22d3ee'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @kirimkata_invitation
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid #374151',
            paddingTop: '2rem',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
            fontFamily: 'Segoe UI, sans-serif',
          }}>
            © {new Date().getFullYear()} KirimKata. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
