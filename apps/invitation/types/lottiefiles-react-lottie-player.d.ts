declare module '@lottiefiles/react-lottie-player' {
  import * as React from 'react';

  export interface PlayerProps extends React.HTMLAttributes<HTMLDivElement> {
    autoplay?: boolean;
    loop?: boolean;
    src: string | object;
    speed?: number;
    style?: React.CSSProperties;
  }

  export const Player: React.ComponentType<PlayerProps>;
}
