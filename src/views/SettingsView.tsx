import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface SettingsViewProps {
    onNext: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNext }) => {
    const { settings, updateSettings, files } = useAppStore();

    const handleStart = () => {
        onNext();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Conversion Settings</h2>
                <p style={{ color: 'hsl(var(--color-text-dim))' }}>Configure how your images will be compressed.</p>
            </div>

            {/* Format Selection */}
            <section className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Output Format</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <label
                        title="Convert images to JPEG format"
                        style={{
                            flex: 1,
                            cursor: 'pointer',
                            padding: '1rem',
                            background: settings.format === 'jpeg' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-bg))',
                            color: settings.format === 'jpeg' ? 'hsl(var(--color-bg))' : 'hsl(var(--color-text))',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            border: '1px solid ' + (settings.format === 'jpeg' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))')
                        }}>
                        <input
                            type="radio"
                            name="format"
                            value="jpeg"
                            checked={settings.format === 'jpeg'}
                            onChange={() => updateSettings({ format: 'jpeg' })}
                            style={{ display: 'none' }}
                        />
                        JPEG
                    </label>
                    <label
                        title="Convert images to WebP format (Default)"
                        style={{
                            flex: 1,
                            cursor: 'pointer',
                            padding: '1rem',
                            background: settings.format === 'webp' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-bg))',
                            color: settings.format === 'webp' ? 'hsl(var(--color-bg))' : 'hsl(var(--color-text))',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            border: '1px solid ' + (settings.format === 'webp' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))')
                        }}>
                        <input
                            type="radio"
                            name="format"
                            value="webp"
                            checked={settings.format === 'webp'}
                            onChange={() => updateSettings({ format: 'webp' })}
                            style={{ display: 'none' }}
                        />
                        WebP
                    </label>
                    <label
                        title="Convert images to AVIF format (Best compression, slower)"
                        style={{
                            flex: 1,
                            cursor: 'pointer',
                            padding: '1rem',
                            background: settings.format === 'avif' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-bg))',
                            color: settings.format === 'avif' ? 'hsl(var(--color-bg))' : 'hsl(var(--color-text))',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            border: '1px solid ' + (settings.format === 'avif' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))')
                        }}>
                        <input
                            type="radio"
                            name="format"
                            value="avif"
                            checked={settings.format === 'avif'}
                            onChange={() => updateSettings({ format: 'avif' })}
                            style={{ display: 'none' }}
                        />
                        AVIF
                    </label>
                </div>
            </section>

            {/* Quality Slider */}
            <section className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Quality</h3>
                    <span style={{ fontWeight: 600, color: 'hsl(var(--color-primary))' }}>{settings.quality}%</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.quality}
                    title="Adjust compression level (1-100)"
                    onChange={(e) => updateSettings({ quality: Number(e.target.value) })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--color-text-dim))', marginTop: '0.5rem' }}>
                    <span>Smaller Size</span>
                    <span>Better Quality</span>
                </div>
            </section>

            {/* Resize Options */}
            <section className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: settings.resize ? '1rem' : 0 }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Resize Image</h3>
                    <label className="switch" title="Enable resizing">
                        <input
                            type="checkbox"
                            checked={settings.resize}
                            onChange={(e) => updateSettings({ resize: e.target.checked })}
                        />
                        <span style={{ marginLeft: '0.5rem' }}>{settings.resize ? 'Enabled' : 'Disabled'}</span>
                    </label>
                </div>

                {settings.resize && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Max Width (px)</label>
                        <input
                            type="number"
                            value={settings.maxWidth}
                            min="1"
                            max="10000"
                            title="Maximum width in pixels"
                            onChange={(e) => updateSettings({ maxWidth: Number(e.target.value) })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'hsl(var(--color-bg))',
                                border: '1px solid hsl(var(--color-border))',
                                color: 'hsl(var(--color-text))',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        />
                    </div>
                )}
            </section>

            <button
                className="btn btn-primary"
                onClick={handleStart}
                title="Save settings and return to Compress tab"
                style={{ padding: '1rem', fontSize: '1.1rem' }}
            >
                {files.length === 0 ? 'Save Settings & Go to Compress' : `Start Compression (${files.length} images)`}
            </button>
        </div>
    );
};
