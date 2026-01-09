/**
 * Template System Type Definitions
 * 
 * This file defines the core types for the composable template system.
 * Templates consist of: Opening + Content Layout + Theme Config
 */

import type { ReactNode } from 'react';

// ============================================================================
// Opening Types
// ============================================================================

export type OpeningType =
    | 'parallax-animation'  // Complex parallax animation (current)
    | 'static-cover'        // Simple static cover with button
    | 'video-intro'         // Video introduction
    | 'none';               // No opening (direct to content)

export type LoadingDesignType =
    | 'general'    // White background with progress bar
    | 'custom1';   // Black transparent with animated text

export interface OpeningProps {
    clientSlug: string;
    guestName?: string;
    onComplete: () => void;  // Called when opening animation finishes
    onSkip?: () => void;     // Optional skip functionality
}

export interface OpeningConfig {
    type: OpeningType;
    enabled: boolean;
    loadingDesign?: LoadingDesignType;  // Loading overlay design
    component?: React.ComponentType<OpeningProps>;
    config?: {
        // Opening-specific configuration
        allowSkip?: boolean;
        autoPlayMusic?: boolean;
        [key: string]: any;
    };
}

// ============================================================================
// Content Layout Types
// ============================================================================

export type ContentLayoutType =
    | 'layout-a'  // Current scrollable content
    | 'layout-b'  // Alternative layout
    | 'layout-c'; // Another layout

export interface ContentLayoutProps {
    clientSlug: string;
    guestName?: string;
    brideName?: string;
    groomName?: string;
    weddingDate?: string;
}

export interface ContentLayoutConfig {
    type: ContentLayoutType;
    component: React.ComponentType<ContentLayoutProps>;
    config?: {
        // Layout-specific configuration
        showFooter?: boolean;
        sectionOrder?: string[];
        [key: string]: any;
    };
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent?: string;
    background?: string;
    text?: string;
    [key: string]: string | undefined;
}

export interface ThemeFonts {
    heading: string;
    body: string;
    signature?: string;
    [key: string]: string | undefined;
}

export interface ThemeConfig {
    colors: ThemeColors;
    fonts: ThemeFonts;
    spacing?: {
        section: string;
        container: string;
        [key: string]: string | undefined;
    };
    [key: string]: any;
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateMetadata {
    key: string;
    name: string;
    description?: string;
    preview?: string;
    author?: string;
    version?: string;
    tags?: string[];
}

export interface TemplateConfig {
    metadata: TemplateMetadata;
    opening: OpeningConfig;
    contentLayout: ContentLayoutConfig;
    theme: ThemeConfig;
}

export interface TemplateDefinition extends TemplateConfig {
    // Legacy support - for backward compatibility
    render?: React.ComponentType<TemplateRendererProps>;

    // Asset manifest (optional)
    getAssetManifest?: () => AssetResource[];

    // Animation config (optional, for openings)
    animationConfig?: any;

    // Text config (optional)
    textConfig?: any;
}

// ============================================================================
// Renderer Types
// ============================================================================

export interface TemplateRendererProps {
    clientSlug: string;
    guestName?: string;
    fullInvitationContent?: any; // From database
}

export interface OpeningWrapperProps {
    config: OpeningConfig;
    clientSlug: string;
    guestName?: string;
    onComplete: () => void;
}

export interface ContentWrapperProps {
    config: ContentLayoutConfig;
    clientSlug: string;
    guestName?: string;
    fullInvitationContent?: any;
}

// ============================================================================
// Asset Types (from existing system)
// ============================================================================

export interface AssetResource {
    src: string;
    type?: 'image' | 'audio' | 'data';  // Optional to match existing implementation
    loop?: boolean;
    registerAsBackgroundAudio?: boolean;
}

// ============================================================================
// Registry Types
// ============================================================================

export type TemplateRegistry = Record<string, TemplateDefinition>;

export interface TemplateRegistryMethods {
    getTemplate(key: string): TemplateDefinition | undefined;
    listTemplates(): TemplateDefinition[];
    registerTemplate(template: TemplateDefinition): void;
}
