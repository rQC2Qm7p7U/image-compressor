import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface SettingsViewProps {
    onNext: () => void;
}

const FORMATS = [
    { value: 'jpeg', label: 'JPEG', tip: 'Convert images to JPEG format' },
    { value: 'webp', label: 'WebP', tip: 'Convert images to WebP format (Default)' },
    { value: 'avif', label: 'AVIF', tip: 'Best compression, slower' },
] as const;

export const SettingsView: React.FC<SettingsViewProps> = ({ onNext }) => {
    const { settings, updateSettings, files } = useAppStore();

    return (
        <div className="settings-view">
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Conversion Settings</h2>
                <p className="settings-view__subtitle">Configure how your images will be compressed.</p>
            </div>

            {/* Format Selection */}
            <section className="card settings-section">
                <h3 className="settings-section__title">Output Format</h3>
                <div className="format-options">
                    {FORMATS.map(fmt => (
                        <label
                            key={fmt.value}
                            title={fmt.tip}
                            className={`format-option${settings.format === fmt.value ? ' active' : ''}`}
                        >
                            <input
                                type="radio"
                                name="format"
                                value={fmt.value}
                                checked={settings.format === fmt.value}
                                onChange={() => updateSettings({ format: fmt.value })}
                            />
                            {fmt.label}
                        </label>
                    ))}
                </div>
            </section>

            {/* Quality Slider */}
            <section className="card settings-section">
                <div className="quality-header">
                    <h3 className="settings-section__title" style={{ marginBottom: 0 }}>Quality</h3>
                    <span className="quality-value">{settings.quality}%</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.quality}
                    title="Adjust compression level (1-100)"
                    onChange={(e) => updateSettings({ quality: Number(e.target.value) })}
                />
                <div className="quality-labels">
                    <span>Smaller Size</span>
                    <span>Better Quality</span>
                </div>
            </section>

            {/* Resize Options */}
            <section className="card settings-section">
                <div className="resize-header" style={{ marginBottom: settings.resize ? '1rem' : 0 }}>
                    <h3 className="settings-section__title" style={{ marginBottom: 0 }}>Resize Image</h3>
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
                            className="resize-input"
                        />
                    </div>
                )}
            </section>

            <button
                className="btn btn-primary settings-submit"
                onClick={onNext}
                title="Save settings and return to Compress tab"
            >
                {files.length === 0 ? 'Save Settings & Go to Compress' : `Start Compression (${files.length} images)`}
            </button>
        </div>
    );
};
