'use client';

import { useState } from 'react';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const rsvpTypography = typographyConfig.scrollable.rsvp;

interface RSVPSectionProps {
  onSubmit?: (data: { name: string; guestCount: string; attendance: string }) => void;
}

export default function RSVPSection({ onSubmit }: RSVPSectionProps) {
  const [name, setName] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [attendance, setAttendance] = useState('');

  const { ref: headerRef, style: headerStyle } = useInViewSlideIn({
    direction: 'up',
    distance: 24,
  });

  const { ref: formRef, style: formStyle } = useInViewSlideIn({
    direction: 'up',
    distance: 24,
    delayMs: 120,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ name, guestCount, attendance });
    }
    // Reset form
    setName('');
    setGuestCount('');
    setAttendance('');
  };

  return (
    <section className="w-full py-16">
      <div ref={headerRef} style={headerStyle}>
        <h2
          className="text-white mb-10 text-center font-light"
          style={{
            ...getTypographyStyle(rsvpTypography.title),
          }}
        >
          RSVP
        </h2>
      </div>
      
      <div
        ref={formRef}
        className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto"
        style={formStyle}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-white/90 mb-3 text-sm font-medium tracking-wide"
              style={
                rsvpTypography.body
                  ? getTypographyStyle(rsvpTypography.body)
                  : {}
              }
            >
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/50 transition-all"
              style={
                rsvpTypography.body
                  ? getTypographyStyle(rsvpTypography.body)
                  : {}
              }
              required
            />
          </div>
          
          <div>
            <label
              className="block text-white/90 mb-3 text-sm font-medium tracking-wide"
              style={
                rsvpTypography.body
                  ? getTypographyStyle(rsvpTypography.body)
                  : {}
              }
            >
              Jumlah Tamu
            </label>
            <select
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/50 transition-all"
              style={
                rsvpTypography.body
                  ? getTypographyStyle(rsvpTypography.body)
                  : {}
              }
              required
            >
              <option value="" className="text-gray-800">Pilih jumlah tamu</option>
              <option value="1" className="text-gray-800">1 Orang</option>
              <option value="2" className="text-gray-800">2 Orang</option>
              <option value="3" className="text-gray-800">3 Orang</option>
              <option value="4" className="text-gray-800">4+ Orang</option>
            </select>
          </div>
          
          <div>
            <label
              className="block text-white/90 mb-3 text-sm font-medium tracking-wide"
              style={
                rsvpTypography.body
                  ? getTypographyStyle(rsvpTypography.body)
                  : {}
              }
            >
              Konfirmasi Kehadiran
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAttendance('yes')}
                className={`flex-1 px-6 py-3.5 rounded-xl border font-medium transition-all duration-300 ${
                  attendance === 'yes'
                    ? 'bg-green-500/40 border-green-500/60 text-white'
                    : 'bg-green-500/20 border-green-500/40 text-white hover:bg-green-500/30 hover:border-green-500/60'
                }`}
                style={
                  rsvpTypography.body
                    ? getTypographyStyle(rsvpTypography.body)
                    : {}
                }
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => setAttendance('no')}
                className={`flex-1 px-6 py-3.5 rounded-xl border font-medium transition-all duration-300 ${
                  attendance === 'no'
                    ? 'bg-red-500/40 border-red-500/60 text-white'
                    : 'bg-red-500/20 border-red-500/40 text-white hover:bg-red-500/30 hover:border-red-500/60'
                }`}
                style={
                  rsvpTypography.body
                    ? getTypographyStyle(rsvpTypography.body)
                    : {}
                }
              >
                Tidak Hadir
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-4 rounded-xl bg-white/20 border border-white/30 text-white font-semibold tracking-wide hover:bg-white/30 hover:border-white/40 transition-all duration-300 mt-2"
            style={
              rsvpTypography.body
                ? getTypographyStyle(rsvpTypography.body)
                : {}
            }
          >
            Kirim RSVP
          </button>
        </form>
      </div>
    </section>
  );
}
