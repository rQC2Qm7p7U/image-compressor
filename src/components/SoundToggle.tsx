import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Volume2, VolumeX } from 'lucide-react';
import { playUISound } from '../lib/audio';

export const SoundToggle: React.FC = () => {
    const { settings, updateSettings } = useAppStore();
    const { soundEnabled } = settings;

    const toggleSound = () => {
        // Play click immediately if we are enabling sound so the user hears it turning on
        // Or if we disable it, we don't play it.
        const newValue = !soundEnabled;
        updateSettings({ soundEnabled: newValue });
        
        // Timeout to let state propagate if we just enabled it
        if (newValue) {
            setTimeout(() => playUISound('click'), 10);
        }
    };

    return (
        <button 
            className="icon-control-btn"
            onClick={toggleSound}
            title={soundEnabled ? 'Звук включен (Нажмите, чтобы отключить)' : 'Звук выключен (Нажмите, чтобы включить)'}
            aria-label="Переключить звук"
        >
            <div className={`theme-toggle-inner`}>
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
        </button>
    );
};
