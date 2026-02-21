import React, { type ReactNode } from 'react';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
    count?: number;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, count }) => {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                background: active ? 'hsl(var(--color-bg-hover))' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
                color: active ? 'hsl(var(--color-text))' : 'hsl(var(--color-text-dim))',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                fontWeight: 500
            }}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span style={{
                    background: 'hsl(var(--color-primary))',
                    color: 'black',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                }}>
                    {count}
                </span>
            )}
        </button>
    );
};
