'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};

// ─── Individual Toast ──────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string; Icon: React.FC<any> }> = {
    success: { bg: '#d1fae5', border: '#6ee7b7', color: '#065f46', Icon: CheckCircle },
    error: { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', Icon: XCircle },
    info: { bg: '#dbeafe', border: '#93c5fd', color: '#1e3a8a', Icon: CheckCircle },
};

const ToastItem: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const { bg, border, color, Icon } = TOAST_STYLES[toast.type];
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: '280px',
                maxWidth: '400px',
                animation: 'toast-in 0.2s ease',
            }}
        >
            <Icon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, lineHeight: '1.4' }}>{toast.message}</span>
            <button
                onClick={onDismiss}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: '0', display: 'flex', flexShrink: 0 }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

// ─── Container ────────────────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
    toasts,
    onDismiss,
}) => {
    if (toasts.length === 0) return null;
    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            {toasts.map(t => (
                <div key={t.id} style={{ pointerEvents: 'auto' }}>
                    <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
                </div>
            ))}
            <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </div>
    );
};
