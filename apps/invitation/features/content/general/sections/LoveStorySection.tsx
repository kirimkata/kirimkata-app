'use client';

import { getLoveStoryConfig } from '@/config/loveStoryConfig';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const loveStoryTypography = typographyConfig.scrollable.loveStory;

export default function LoveStorySection() {
  const invitationContent = useInvitationContent();
  const fallbackConfig = getLoveStoryConfig();
  const config = invitationContent
    ? {
        mainTitle: invitationContent.loveStory.mainTitle,
        backgroundImage: invitationContent.loveStory.backgroundImage,
        overlayOpacity: invitationContent.loveStory.overlayOpacity,
        blocks: invitationContent.loveStory.blocks.map((block) => ({ ...block })),
      }
    : fallbackConfig;

  const { ref: titleRef, style: titleStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 30,
  });

  return (
    <section
      className="w-full relative"
      style={{
        padding: '20px 24px',
        backgroundImage: `url(${config.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,' + config.overlayOpacity + ')' }} />

      <div className="relative z-10 w-full max-w-xl text-center text-white">
        {/* Main script title */}
        <div
          ref={titleRef}
          style={titleStyle}
        >
          <h1 
            className="mb-10 md:mb-12 mt-8 pt-[30px]"
            style={{
              marginTop: '40px',
              ...(loveStoryTypography.title
                ? getTypographyStyle(loveStoryTypography.title)
                : {}),
            }}
          >
            Our Love Story
          </h1>
        </div>

        {/* Story blocks */}
        <div
          className="space-y-[90px] md:space-y-[120px]"
          style={{ marginTop: '40px' }}
        >
          {config.blocks.map((block, index) => (
            <LoveStoryBlock
              key={index}
              block={block}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface LoveStoryBlockProps {
  block: { title: string; body: string };
  index: number;
}

function LoveStoryBlock({ block, index }: LoveStoryBlockProps) {
  const { ref: blockTitleRef, style: blockTitleStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 30,
    delayMs: index * 140,
  });

  const { ref: blockBodyRef, style: blockBodyStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 30,
    delayMs: index * 140 + 80,
  });

  return (
    <div
      className="pb-6 md:pb-8"
      style={{
        marginBottom: '20px',
        marginLeft: '20px',
        marginRight: '20px',
      }}
    >
      <h2
        ref={blockTitleRef}
        className="text-3xl md:text-3xl mb-4"
        style={{
          ...(loveStoryTypography.subtitle
            ? getTypographyStyle(loveStoryTypography.subtitle)
            : {}),
          ...blockTitleStyle,
        }}
      >
        {block.title}
      </h2>
      <p
        ref={blockBodyRef}
        className="text-base leading-relaxed max-w-prose mx-auto opacity-90 mt-3 mb-6"
        style={{
          ...(loveStoryTypography.body
            ? getTypographyStyle(loveStoryTypography.body)
            : {}),
          ...blockBodyStyle,
        }}
      >
        {block.body}
      </p>
    </div>
  );
}
