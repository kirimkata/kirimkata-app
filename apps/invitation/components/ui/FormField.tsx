'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface FormFieldProps {
    label: string;
    hint?: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    hint,
    required,
    error,
    children,
    style,
}) => {
    const { colors } = useTheme();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
            <label
                style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: error ? '#ef4444' : colors.textSecondary,
                    display: 'block',
                    userSelect: 'none',
                    cursor: 'default',
                }}
            >
                {label}
                {required && (
                    <span style={{ color: '#6366f1', marginLeft: '3px' }}>*</span>
                )}
            </label>
            {children}
            {hint && !error && (
                <span style={{ fontSize: '11px', color: colors.textSecondary, opacity: 0.7 }}>
                    {hint}
                </span>
            )}
            {error && (
                <span style={{ fontSize: '11px', color: '#ef4444' }}>{error}</span>
            )}
        </div>
    );
};
