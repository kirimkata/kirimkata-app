'use client';

import { useState } from 'react';

interface MessageTemplate {
    title: string;
    content: string;
}

export default function MessageTemplatePage() {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const templates: MessageTemplate[] = [
        {
            title: 'Mengundang Muslim',
            content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Bismillahirrahmanirrahim

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i {nama} untuk menghadiri acara pernikahan kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh`
        },
        {
            title: 'Pemberitahuan Muslim',
            content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Bismillahirrahmanirrahim

Tanpa mengurangi rasa hormat, perkenankan kami memberitahukan bahwa kami akan melangsungkan acara pernikahan.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i {nama} berkenan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh`
        },
        {
            title: 'Mengundang Universal',
            content: `Kepada Yth.
Bapak/Ibu/Saudara/i {nama}

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara pernikahan kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.`
        },
        {
            title: 'Pemberitahuan Universal',
            content: `Kepada Yth.
Bapak/Ibu/Saudara/i {nama}

Tanpa mengurangi rasa hormat, perkenankan kami memberitahukan bahwa kami akan melangsungkan acara pernikahan.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.`
        },
        {
            title: 'Mengundang English',
            content: `Dear Mr./Mrs./Ms. {nama}

With all due respect, we would like to invite you to attend our wedding ceremony.

Here is our invitation link, for complete information about the event, please visit:
{link}

It would be a great honor for us if you could attend and give us your blessing.

We apologize for sharing this invitation only through this message.
Thank you very much for your attention.`
        },
        {
            title: 'Pemberitahuan English',
            content: `Dear Mr./Mrs./Ms. {nama}

With all due respect, we would like to inform you that we will be holding our wedding ceremony.

Here is our invitation link, for complete information about the event, please visit:
{link}

It would be a great honor for us if you could give us your blessing.

We apologize for sharing this invitation only through this message.
Thank you very much for your attention.`
        },
        {
            title: 'Acara Lamaran',
            content: `Kepada Yth.
Bapak/Ibu/Saudara/i {nama}

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara lamaran kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.`
        },
        {
            title: 'Acara Aqiqah',
            content: `Kepada Yth.
Bapak/Ibu/Saudara/i {nama}

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara aqiqah putra/putri kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.
Terima kasih banyak atas perhatiannya.`
        }
    ];

    const handleCopy = (content: string, index: number) => {
        navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <>
            <div className="page-container">

                <div className="intro-section">
                    <p>
                        Berikut adalah contoh format kata-kata untuk mengirim undangan.
                        Silakan bisa kamu pilih format yang cocok untuk undangan kamu, kemudian bisa kamu copy dan paste pada halaman <strong>Kirim Undangan</strong>.
                    </p>
                    <div className="info-box">
                        <strong>📝 Catatan:</strong> <code>{'{nama}'}</code> dan <code>{'{link}'}</code> tidak perlu diedit, karena akan terisi otomatis.
                    </div>
                </div>

                <div className="templates-grid">
                    {templates.map((template, index) => (
                        <div key={index} className="template-card">
                            <div className="template-header">
                                <h3>{template.title}</h3>
                                <button
                                    onClick={() => handleCopy(template.content, index)}
                                    className={`copy-btn ${copiedIndex === index ? 'copied' : ''}`}
                                    title="Copy template"
                                >
                                    {copiedIndex === index ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="template-content">
                                <pre>{template.content}</pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .page-container {
                    max-width: 1200px;
                    padding: 0 0.75rem 1.5rem;
                    min-height: 100%;
                }

                .intro-section {
                    padding: 0 0.75rem;
                    margin-bottom: 1rem;
                }

                .intro-section p {
                    color: #4b5563;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                }

                .info-box {
                    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
                    border-left: 4px solid #3b82f6;
                    padding: 0.85rem;
                    border-radius: 0.375rem;
                    font-size: 0.8125rem;
                    color: #1e40af;
                }

                .info-box code {
                    background: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.8125rem;
                    color: #dc2626;
                    font-weight: 600;
                }

                .templates-grid {
                    padding: 0 0.75rem 1.25rem;
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }

                @media (min-width: 768px) {
                    .templates-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                .template-card {
                    background: white;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    transition: all 0.2s ease;
                }

                .template-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                .template-header {
                    padding: 0.75rem;
                    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.375rem;
                }

                .template-header h3 {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }

                .copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.4rem 0.75rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .copy-btn:hover {
                    background: #2563eb;
                    transform: scale(1.05);
                }

                .copy-btn:active {
                    transform: scale(0.98);
                }

                .copy-btn.copied {
                    background: #10b981;
                }

                .template-content {
                    padding: 0.85rem;
                }

                .template-content pre {
                    margin: 0;
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 0.775rem;
                    line-height: 1.6;
                    color: #374151;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                @media (max-width: 767px) {
                    .page-header h1 {
                        font-size: 1.2rem;
                    }

                    .template-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .copy-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .template-content pre {
                        font-size: 0.725rem;
                    }
                }
            `}</style>
        </>
    );
}
