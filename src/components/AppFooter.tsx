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
        <footer style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'hsl(var(--color-text-dim))',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'center'
        }}>
            <div>
                <span>Created by </span>
                <a href="https://kwork.ru/user/leoworks" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--color-primary))', textDecoration: 'none' }}>LeoWorks</a>
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <a href="https://github.com/rQC2Qm7p7U/image-compressor" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--color-text-dim))', textDecoration: 'underline' }}>GitHub</a>
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <a href="https://image-compressor-leoworks.netlify.app" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--color-text-dim))', textDecoration: 'underline' }}>Netlify</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>v{version}</span>
                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        style={{
                            background: 'hsl(var(--color-primary))',
                            color: 'black',
                            border: 'none',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                        Update Available
                    </button>
                )}
            </div>
        </footer>
    );
};
