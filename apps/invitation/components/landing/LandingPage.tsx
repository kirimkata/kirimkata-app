import Link from 'next/link';
import Image from 'next/image';
import { CLIENTS } from '@/clients';

export default function LandingPage() {
  const clientEntries = Object.values(CLIENTS);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f1ed',
        color: '#2c2a28',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <section
        style={{
          padding: '80px 24px 40px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.85rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: '#6b6b6b',
            marginBottom: '16px',
          }}
        >
          Kirim Kata Studio
        </p>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 600,
            marginBottom: '24px',
            lineHeight: 1.2,
          }}
        >
          Custom Parallax Wedding Invitation Showcase
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: '#5f5d5b',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Web Under development.
        </p>
      </section>

      {/* <section
        style={{
          padding: '0 24px 80px',
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}
        >
          {clientEntries.map(({ profile }) => (
            <article
              key={profile.slug}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
              }}
            >
              <div style={{ position: 'relative', width: '100%', paddingTop: '56%' }}>
                {profile.coverImage ? (
                  <Image
                    src={profile.coverImage}
                    alt={profile.coupleNames}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#d9d9d9' }} />
                )}
              </div>
              <div
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flexGrow: 1,
                }}
              >
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#2c2a28',
                  }}
                >
                  {profile.coupleNames}
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#7c7a77' }}>{profile.weddingDateLabel}</p>
                {profile.locationLabel && (
                  <p style={{ fontSize: '0.95rem', color: '#7c7a77' }}>{profile.locationLabel}</p>
                )}
                {profile.shortDescription && (
                  <p style={{ fontSize: '0.95rem', color: '#524f4c', lineHeight: 1.6 }}>
                    {profile.shortDescription}
                  </p>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <Link
                    href={`/${profile.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '999px',
                      backgroundColor: '#2c2a28',
                      color: '#ffffff',
                      padding: '10px 28px',
                      fontSize: '0.85rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    Lihat Undangan
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section> */}
    </main>
  );
}
