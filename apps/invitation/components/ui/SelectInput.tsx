'use client';

import React from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
    ({ error, style, children, ...props }, ref) => {
        const { colors } = useTheme();

        const selectStyle: React.CSSProperties = {
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: `1px solid ${error ? '#ef4444' : colors.border}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
            ...style,
        };

        // Inject background + color on each <option> so they're visible in dark mode
        // (browser-native option list ignores parent color in dark themes)
        const styledChildren = React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === 'option') {
                return React.cloneElement(child as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>, {
                    style: {
                        backgroundColor: colors.sidebar,
                        color: colors.text,
                        ...(child.props as any).style,
                    },
                });
            }
            return child;
        });

        return (
            <select ref={ref} style={selectStyle} {...props}>
                {styledChildren}
            </select>
        );
    }
);

SelectInput.displayName = 'SelectInput';

