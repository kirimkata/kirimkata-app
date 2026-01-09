'use client';

import { useEffect } from 'react';
import { generateFontFaces, type FontKey } from './fontBank';

interface FontLoaderProps {
    fonts: FontKey[];
}

/**
 * FontLoader Component
 * 
 * Dynamically loads fonts by injecting @font-face CSS declarations
 * into the document head. This allows themes to load only the fonts
 * they need without bundling all fonts.
 * 
 * Usage:
 * ```tsx
 * <FontLoader fonts={['ebGaramond', 'rasa']} />
 * ```
 */
export default function FontLoader({ fonts }: FontLoaderProps) {
    useEffect(() => {
        // Generate CSS for all requested fonts
        const fontFaceCSS = generateFontFaces(fonts);

        if (!fontFaceCSS) return;

        // Create a unique ID for this font loader
        const styleId = `font-loader-${fonts.join('-')}`;

        // Check if style tag already exists
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleTag) {
            // Create new style tag
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            styleTag.textContent = fontFaceCSS;
            document.head.appendChild(styleTag);
        } else {
            // Update existing style tag
            styleTag.textContent = fontFaceCSS;
        }

        // Cleanup function
        return () => {
            // Optional: Remove style tag when component unmounts
            // Commented out to keep fonts loaded even if component unmounts
            // const tag = document.getElementById(styleId);
            // if (tag) tag.remove();
        };
    }, [fonts]);

    return null; // This component doesn't render anything
}
