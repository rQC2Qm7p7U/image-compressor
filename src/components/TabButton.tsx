import React, { type ReactNode } from 'react';
import { playUISound } from '../lib/audio';

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
            onClick={() => {
                playUISound('click');
                onClick();
            }}
            className={`tab-btn${active ? ' active' : ''}`}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span className="tab-btn__badge">{count}</span>
            )}
        </button>
    );
};
