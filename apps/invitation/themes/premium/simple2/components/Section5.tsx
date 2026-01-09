'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface LoveStoryBlock {
    title?: string;
    body: string;
}

interface Section5Props {
    mainTitle: string;
    coupleLabel: string;
    centerImageUrl: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    blocks: LoveStoryBlock[];
}

export default function Section5({
    mainTitle,
    coupleLabel,
    centerImageUrl,
    backgroundImageUrl,
    overlayOpacity = 0.6,
    blocks,
}: Section5Props) {
    return (
        <section
            style={{
                position: 'relative',
                width: '100%',
                height: 'calc(var(--vh, 1vh) * 100)',
                overflow: 'hidden',
            }}
        >
            <FontLoader fonts={['ebGaramond', 'rasa', 'satisfy']} />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'saturate(0.9)',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        padding: '70px 22px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                    }}
                >
                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '26px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            margin: 0,
                            textAlign: 'center',
                        }}
                    >
                        {mainTitle}
                    </h2>

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '360px',
                            aspectRatio: '4 / 3',
                            overflow: 'hidden',
                            borderRadius: '2px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${centerImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        />
                    </div>

                    <p
                        style={{
                            fontFamily: getFontFamily('satisfy', 'cursive'),
                            fontSize: '18px',
                            fontWeight: 400,
                            color: 'rgba(255, 255, 255, 0.92)',
                            margin: '2px 0 0 0',
                        }}
                    >
                        {`- ${coupleLabel} -`}
                    </p>

                    <div
                        className="simple2-love-story-scroll"
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            marginTop: '6px',
                            flex: 1,
                            overflowY: 'auto',
                            paddingRight: '6px',
                            overscrollBehavior: 'contain',
                        }}
                    >
                        <style jsx>{`
                            .simple2-love-story-scroll::-webkit-scrollbar {
                                width: 0;
                                height: 0;
                                background: transparent;
                            }
                            .simple2-love-story-scroll {
                                scrollbar-width: none;
                                -ms-overflow-style: none;
                            }
                        `}</style>

                        {blocks.map((block, idx) => (
                            <div key={`${idx}-${block.title ?? 'block'}`} style={{ marginBottom: '14px' }}>
                                {block.title ? (
                                    <p
                                        style={{
                                            fontFamily: getFontFamily('rasa', 'serif'),
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'rgba(255,255,255,0.95)',
                                            margin: '0 0 6px 0',
                                        }}
                                    >
                                        {block.title},
                                    </p>
                                ) : null}

                                <p
                                    style={{
                                        fontFamily: getFontFamily('rasa', 'serif'),
                                        fontSize: '14px',
                                        fontWeight: 300,
                                        lineHeight: 1.65,
                                        color: 'rgba(255,255,255,0.9)',
                                        margin: 0,
                                    }}
                                >
                                    {block.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
