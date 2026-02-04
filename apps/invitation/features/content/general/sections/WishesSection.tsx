'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';
import { API_ENDPOINTS } from '@/lib/api-config';

type AttendanceStatus = 'hadir' | 'tidak-hadir' | 'masih-ragu';

const LottiePlayer = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((m) => m.Player),
  { ssr: false },
);

const wishesTypography = typographyConfig.scrollable.wishes;

interface Message {
  id: number;
  name: string;
  message: string;
  timeAgo: string;
  attendance?: AttendanceStatus;
}

interface WishesSectionProps {
  invitationSlug: string;
  onSubmit?: (data: { name: string; message: string }) => void;
  messages?: Message[];
}

export default function WishesSection({ invitationSlug, onSubmit, messages }: WishesSectionProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [items, setItems] = useState<Message[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSentAnimation, setShowSentAnimation] = useState(false);

  const totalWishes = items.length;

  const displayMessages = items.length > 0 ? items : [];

  const { ref: titleRef, style: titleStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 30,
  });

  const { ref: subtitleRef, style: subtitleStyle } = useInViewSlideIn({
    direction: 'right',
    distance: 30,
    delayMs: 100,
  });

  const { ref: nameInputRef, style: nameInputStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 28,
    delayMs: 200,
  });

  const { ref: messageInputRef, style: messageInputStyle } = useInViewSlideIn({
    direction: 'right',
    distance: 28,
    delayMs: 280,
  });

  const { ref: submitButtonRef, style: submitButtonStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 24,
    delayMs: 360,
  });

  const formatTimeAgo = (isoString: string): string => {
    const created = new Date(isoString);
    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  };

  const loadWishes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.wishes.list(invitationSlug));

      if (!response.ok) {
        throw new Error('Failed to fetch wishes');
      }

      const data = await response.json();
      const wishes = data.wishes || [];

      setItems(
        wishes.map((wish: any) => ({
          id: wish.id,
          name: wish.name,
          message: wish.message,
          attendance: wish.attendance,
          timeAgo: formatTimeAgo(wish.createdAt),
        })),
      );
    } catch (error) {
      console.error('Failed to load wishes from API', error);
    }
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      setItems(messages);
      return;
    }
    // Load from Supabase on mount
    loadWishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showSentAnimation) return;
    const timer = setTimeout(() => {
      setShowSentAnimation(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [showSentAnimation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (onSubmit) {
        onSubmit({ name, message });
      }

      // Submit wish to Cloudflare Workers API
      const response = await fetch(API_ENDPOINTS.wishes.submit(invitationSlug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          message,
          attendance: attendance as AttendanceStatus,
          guest_count: parseInt(guestCount, 10) || 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit wish');
      }

      await loadWishes();
      setShowSentAnimation(true);
    } catch (error) {
      console.error('Failed to submit wish', error);
    } finally {
      setSubmitting(false);
      setName('');
      setMessage('');
      setAttendance('');
      setGuestCount('1');
    }
  };

  return (
    <section
      style={{
        width: '100%',
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#d7d1c6',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Card Container - plain foreground panel with shadow */}
        <div>
          {/* Content */}
          <div
            style={{
              paddingTop: 32,
              paddingBottom: 40,
            }}
          >
            {showSentAnimation && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <LottiePlayer
                  autoplay
                  loop={false}
                  src="/sent.json"
                  style={{
                    width: '50vw',
                    maxWidth: 260,
                    height: 'auto',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {/* Title */}
            <h2
              ref={titleRef}
              className="text-center"
              style={{
                textAlign: 'center',
                marginBottom: 32,
                color: '#4f4a3f',
                ...getTypographyStyle(wishesTypography.title),
                ...titleStyle,
              }}
            >
              Wedding Wishes
            </h2>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              style={{
                textAlign: 'center',
                marginTop: 0,
                marginBottom: 28,
                color: '#4f4a3f',
                ...(wishesTypography.subtitle ? getTypographyStyle(wishesTypography.subtitle) : {}),
                ...subtitleStyle,
              }}
            >
              Tell us you&apos;re coming and leave a few words—we&apos;d love to hear from you!
            </p>

            {/* Counter Badge */}
            <div style={{ display: 'none' }}>
              {totalWishes} Ucapan
            </div>

            {/* Attendance Buttons */}
            <div style={{ display: 'none' }} />

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: 8,
              }}
            >
              {/* Name Input */}
              <div
                ref={nameInputRef}
                style={{
                  marginBottom: 12,
                  ...nameInputStyle,
                }}
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: '1px solid #c9c3b8',
                    backgroundColor: '#ffffff',
                    color: '#33332f',
                    fontSize: 14,
                    outline: 'none',
                    ...(wishesTypography.body
                      ? getTypographyStyle(wishesTypography.body)
                      : {}),
                  }}
                  required
                />
              </div>

              {/* Message Textarea */}
              <div
                ref={messageInputRef}
                style={{
                  marginBottom: 12,
                  ...messageInputStyle,
                }}
              >
                <textarea
                  rows={3}
                  placeholder="Leave a Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  minLength={10}
                  maxLength={200}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: '1px solid #c9c3b8',
                    backgroundColor: '#ffffff',
                    color: '#33332f',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    ...(wishesTypography.body
                      ? getTypographyStyle(wishesTypography.body)
                      : {}),
                  }}
                  required
                />
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: message.length < 20 ? '#4f4a3f' : message.length > 200 ? '#4f4a3f' : '#6b7280',
                    textAlign: 'right',
                  }}
                >
                  {message.length}/200
                </div>
              </div>

              {/* Attendance Dropdown */}
              <div
                style={{
                  marginBottom: attendance === 'hadir' ? 12 : 20,
                }}
              >
                <select
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: '1px solid #c9c3b8',
                    backgroundColor: '#ffffff',
                    color: '#33332f',
                    fontSize: 14,
                    outline: 'none',
                    appearance: 'none',
                    ...(wishesTypography.body
                      ? getTypographyStyle(wishesTypography.body)
                      : {}),
                  }}
                  required
                >
                  <option value="" disabled>Konfirmasi Kehadiran</option>
                  <option value="hadir">Hadir</option>
                  <option value="tidak-hadir">Tidak Hadir</option>
                  <option value="masih-ragu">Masih Ragu</option>
                </select>
              </div>

              {attendance === 'hadir' && (
                <div
                  style={{
                    marginBottom: 20,
                  }}
                >
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: 10,
                      border: '1px solid #c9c3b8',
                      backgroundColor: '#ffffff',
                      color: '#33332f',
                      fontSize: 14,
                      outline: 'none',
                      appearance: 'none',
                      ...(wishesTypography.body
                        ? getTypographyStyle(wishesTypography.body)
                        : {}),
                    }}
                    required
                  >
                    <option value="1">1 Orang</option>
                    <option value="2">2 Orang</option>
                    <option value="3">3 Orang</option>
                    <option value="4">4 Orang</option>
                    <option value="5">5 Orang</option>
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <div
                ref={submitButtonRef}
                style={{
                  marginTop: 8,
                  ...submitButtonStyle,
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#4f4a3f',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'default' : 'pointer',
                    ...(wishesTypography.button
                      ? getTypographyStyle(wishesTypography.button)
                      : wishesTypography.body
                        ? getTypographyStyle(wishesTypography.body)
                        : {}),
                  }}
                >
                  {submitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop: 40,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #c9c3b8',
                backgroundColor: '#e3ddd2',
                maxHeight: '40vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {displayMessages.map((msg, index) => (
                <WishMessage
                  key={msg.id}
                  message={msg}
                  index={index}
                  isLast={index === displayMessages.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface WishMessageProps {
  message: Message;
  index: number;
  isLast: boolean;
}

function WishMessage({ message, index, isLast }: WishMessageProps) {
  const { ref, style } = useInViewSlideIn({
    direction: index % 2 === 0 ? 'left' : 'right',
    distance: 32,
    delayMs: Math.min(index * 60, 300),
  });

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #d3cec4',
        padding: '16px 20px',
        marginBottom: isLast ? 0 : 16,
        ...style,
      }}
    >
      <div
        style={{
          color: '#273141',
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 4,
          ...(wishesTypography.guestName
            ? getTypographyStyle(wishesTypography.guestName)
            : wishesTypography.subtitle
              ? getTypographyStyle(wishesTypography.subtitle)
              : {}),
        }}
      >
        <span>{message.name}</span>
        {message.attendance === 'hadir' && (
          <span
            style={{
              marginLeft: 8,
              color: '#16a34a',
              fontSize: 14,
              fontWeight: 'bold',
            }}
            aria-label="Akan hadir"
          >
            ✓
          </span>
        )}
        {message.attendance === 'tidak-hadir' && (
          <span
            style={{
              marginLeft: 8,
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 'bold',
            }}
            aria-label="Tidak hadir"
          >
            ✗
          </span>
        )}
        {message.attendance === 'masih-ragu' && (
          <span
            style={{
              marginLeft: 8,
              color: '#eab308',
              fontSize: 14,
              fontWeight: 'bold',
            }}
            aria-label="Masih ragu"
          >
            ?
          </span>
        )}
      </div>
      <div
        style={{
          color: '#333843',
          fontSize: 14,
          marginBottom: 4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(wishesTypography.body
            ? getTypographyStyle(wishesTypography.body)
            : {}),
        }}
      >
        {message.message}
      </div>
      <div
        style={{
          color: '#8b919b',
          fontSize: 12,
          fontStyle: 'italic',
          ...(wishesTypography.body
            ? getTypographyStyle(wishesTypography.body)
            : {}),
        }}
      >
        {message.timeAgo}
      </div>
    </div>
  );
}
