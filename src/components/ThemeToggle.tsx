import React from 'react';
import { useTheme } from './ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun size={20} className="theme-toggle-icon" />;
            case 'dark':
                return <Moon size={20} className="theme-toggle-icon" />;
            case 'system':
                return <Monitor size={20} className="theme-toggle-icon" />;
        }
    };

    const getTitle = () => {
        switch (theme) {
            case 'light': return 'Light Theme (Click to switch to Dark)';
            case 'dark': return 'Dark Theme (Click to switch to System)';
            case 'system': return 'System Theme (Click to switch to Light)';
        }
    };

    return (
        <button 
            className="icon-control-btn animate-fade-up delay-100"
            onClick={cycleTheme}
            title={getTitle()}
            aria-label="Toggle theme"
        >
            <div className={`theme-toggle-inner ${theme}`}>
                {getIcon()}
            </div>
        </button>
    );
};
