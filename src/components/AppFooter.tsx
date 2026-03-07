import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const AppFooter: React.FC = () => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(_r: ServiceWorkerRegistration | undefined) {
            // SW registered — no logging needed in production
        },
        onRegisterError(error: unknown) {
            console.error('SW registration error', error);
        },
    });

    return (
        <footer className="app-footer">
            <div>
                <span>Created by </span>
                <a href="https://kwork.ru/user/leoworks" target="_blank" rel="noopener noreferrer" className="app-footer__link">LeoWorks</a>
                <span className="app-footer__separator">•</span>
                <a href="https://github.com/rQC2Qm7p7U/image-compressor" target="_blank" rel="noopener noreferrer" className="app-footer__link--dim">GitHub</a>
                <span className="app-footer__separator">•</span>
                <a href="https://image-compressor-leoworks.netlify.app" target="_blank" rel="noopener noreferrer" className="app-footer__link--dim">Netlify</a>
            </div>
            <div className="app-footer__version">
                <span>v{version}</span>
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
