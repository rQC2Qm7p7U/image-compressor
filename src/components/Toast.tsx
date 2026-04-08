import React, { useState, useCallback } from 'react';
import { ToastContext, type Toast, type ToastType } from './ToastContext';

/** How long a toast notification stays visible before auto-dismissing */
const TOAST_DURATION_MS = 3500;

let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, TOAST_DURATION_MS);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" role="status" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <div className="toast-content">
                            {t.type === 'success' && <span style={{ color: 'hsl(var(--color-success))', marginRight: '0.4rem' }}>✓</span>}
                            {t.type === 'error' && <span style={{ color: 'hsl(var(--color-error))', marginRight: '0.4rem' }}>✕</span>}
                            {t.message}
                        </div>
                        <div className="toast-progress" style={{ animationDuration: `${TOAST_DURATION_MS}ms` }} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
