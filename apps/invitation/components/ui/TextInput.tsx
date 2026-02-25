'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
    ({ error, style, ...props }, ref) => {
        const { colors } = useTheme();

        const inputStyle: React.CSSProperties = {
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: `1px solid ${error ? '#ef4444' : colors.border}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
            cursor: 'text',
            ...style,
        };

        return <input ref={ref} style={inputStyle} {...props} />;
    }
);

TextInput.displayName = 'TextInput';
