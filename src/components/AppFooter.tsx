import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const LINKS = {
    portfolio: 'https://www.linkedin.com/in/leoshw',
    github: 'https://github.com/rQC2Qm7p7U',
    netlify: 'https://image-compressor-leoworks.netlify.app',
} as const;

export const AppFooter: React.FC = () => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered() {
            // SW registered — no logging needed in production
        },
        onRegisterError(error: unknown) {
            console.error('SW registration error', error);
        },
    });

    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        // Listen to successful install
        const handleAppInstalled = () => {
            setInstallPrompt(null);
        };
        window.addEventListener('appinstalled', handleAppInstalled);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    return (
        <footer className="app-footer">
            <div>
                <span>Created by </span>
                <a href={LINKS.portfolio} target="_blank" rel="noopener noreferrer" className="app-footer__link">LeoWorks</a>
                <span className="app-footer__separator">•</span>
                <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="app-footer__link--dim">GitHub</a>
                <span className="app-footer__separator">•</span>
                <a href={LINKS.netlify} target="_blank" rel="noopener noreferrer" className="app-footer__link--dim">Netlify</a>
            </div>
            <div className="app-footer__version">
                <span>v{version}</span>
                {installPrompt && (
                    <button onClick={handleInstallClick} className="install-btn">
                        Установить приложение
                    </button>
                )}
                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="update-btn"
                    >
                        Update Available
                    </button>
                )}
            </div>
        </footer>
    );
};
