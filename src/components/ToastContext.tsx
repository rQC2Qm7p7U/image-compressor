import React from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = React.createContext<ToastContextValue>({ showToast: () => { } });
export const useToast = () => React.useContext(ToastContext);
