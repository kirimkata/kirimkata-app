'use client';

import React from 'react';
import { Loader } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
    },
    secondary: {
        background: 'rgba(99,102,241,0.1)',
        color: '#818cf8',
        border: '1px solid rgba(99,102,241,0.3)',
    },
    ghost: {
        background: 'transparent',
        color: 'rgba(245,245,240,0.7)',
        border: '1px solid rgba(255,255,255,0.12)',
    },
    danger: {
        background: 'transparent',
        color: '#ef4444',
        border: '1px solid rgba(239,68,68,0.4)',
    },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '7px', gap: '5px' },
    md: { padding: '9px 16px', fontSize: '13px', borderRadius: '8px', gap: '6px' },
    lg: { padding: '12px 20px', fontSize: '14px', borderRadius: '10px', gap: '8px' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            icon,
            iconPosition = 'left',
            fullWidth = false,
            children,
            disabled,
            style,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        const baseStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled && !loading ? 0.5 : 1,
            transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            width: fullWidth ? '100%' : undefined,
            ...VARIANT_STYLES[variant],
            ...SIZE_STYLES[size],
            ...style,
        };

        return (
            <button ref={ref} disabled={isDisabled} style={baseStyle} {...props}>
                {loading ? (
                    <Loader
                        size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14}
                        style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                    />
                ) : (
                    icon && iconPosition === 'left' && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
                )}
                {children && <span>{children}</span>}
                {!loading && icon && iconPosition === 'right' && (
                    <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
                )}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </button>
        );
    }
);

Button.displayName = 'Button';
