import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { playUISound } from '../lib/audio';
import { Tooltip } from '../components/Tooltip';

interface SettingsViewProps {
    onNext: () => void;
}

/** Maximum allowed value for the resize width input (px) */
const MAX_WIDTH_LIMIT = 10000;

const FORMATS = [
    { value: 'jpeg', label: 'JPEG', tip: 'Convert images to JPEG format' },
    { value: 'webp', label: 'WebP', tip: 'Convert images to WebP format (Default)' },
    { value: 'avif', label: 'AVIF', tip: 'Best compression, slower' },
] as const;

export const SettingsView: React.FC<SettingsViewProps> = ({ onNext }) => {
    const { settings, updateSettings, files } = useAppStore();

    return (
        <div className="settings-view animate-fade-up">
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Conversion Settings</h2>
                <p className="settings-view__subtitle">Configure how your images will be compressed.</p>
            </div>

            {/* Format Selection */}
            <section className="card settings-section">
                <h3 className="settings-section__title">Output Format</h3>
                <div className="format-options">
                    {FORMATS.map(fmt => (
                        <Tooltip key={fmt.value} content={fmt.tip}>
                            <label
                                className={`format-option${settings.format === fmt.value ? ' active' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="format"
                                    value={fmt.value}
                                    checked={settings.format === fmt.value}
                                    onChange={() => {
                                        playUISound('click');
                                        updateSettings({ format: fmt.value });
                                    }}
                                />
                                {fmt.label}
                            </label>
                        </Tooltip>
                    ))}
                </div>
            </section>

            {/* Quality Slider */}
            <section className="card settings-section">
                <div className="quality-header">
                    <h3 className="settings-section__title" style={{ marginBottom: 0 }}>Quality</h3>
                    <span className="quality-value">{settings.quality}%</span>
                </div>
                <Tooltip content="Adjust compression level (1-100)">
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={settings.quality}
                        onChange={(e) => updateSettings({ quality: Number(e.target.value) })}
                    />
                </Tooltip>
                <div className="quality-labels">
                    <span>Smaller Size</span>
                    <span>Better Quality</span>
                </div>
            </section>

            {/* Resize Options */}
            <section className="card settings-section">
                <div className="resize-header" style={{ marginBottom: settings.resize ? '1rem' : 0 }}>
                    <h3 className="settings-section__title" style={{ marginBottom: 0 }}>Resize Image</h3>
                    <Tooltip content="Enable resizing">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={settings.resize}
                                onChange={(e) => {
                                    playUISound('click');
                                    updateSettings({ resize: e.target.checked });
                                }}
                            />
                            <span style={{ marginLeft: '0.5rem' }}>{settings.resize ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </Tooltip>
                </div>

                {settings.resize && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Max Width (px)</label>
                        <Tooltip content="Maximum width in pixels">
                            <input
                                type="number"
                                value={settings.maxWidth}
                                min="1"
                                max={MAX_WIDTH_LIMIT}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    updateSettings({ maxWidth: isNaN(val) || val < 1 ? 1 : val });
                                }}
                                className="resize-input"
                            />
                        </Tooltip>
                    </div>
                )}
            </section>

            <button
                className="btn btn-primary settings-submit"
                onClick={() => {
                    playUISound('click');
                    onNext();
                }}
                title="Save settings and return to Compress tab"
            >
                {files.length === 0 ? 'Save Settings & Go to Compress' : `Start Compression (${files.length} images)`}
            </button>
        </div>
    );
};
