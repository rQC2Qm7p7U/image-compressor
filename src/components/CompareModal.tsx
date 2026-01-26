import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './CompareModal.css';

interface CompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalFile: File | null;
    compressedBlob: Blob | null;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, originalFile, compressedBlob }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (originalFile) {
            const url = URL.createObjectURL(originalFile);
            setOriginalUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [originalFile]);

    useEffect(() => {
        if (compressedBlob) {
            const url = URL.createObjectURL(compressedBlob);
            setCompressedUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [compressedBlob]);

    const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    const startDrag = () => setIsDragging(true);
    const stopDrag = () => setIsDragging(false);

    if (!isOpen || !originalUrl || !compressedUrl) return null;

    return (
        <div className="compare-modal-overlay" onClick={onClose}>
            <div className="compare-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><X /></button>

                <div className="compare-header">
                    <h3>Visual Inspection</h3>
                    <p style={{ color: 'hsl(var(--color-text-dim))', fontSize: '0.9rem' }}>Drag slider to compare</p>
                </div>

                <div className="compare-container">
                    <div
                        className="compare-wrapper"
                        ref={containerRef}
                        onMouseMove={handleDrag}
                        onTouchMove={handleDrag}
                        onMouseUp={stopDrag}
                        onMouseLeave={stopDrag}
                        onTouchEnd={stopDrag}
                        onMouseDown={startDrag}
                        onTouchStart={startDrag}
                    >
                        {/* Compressed (Background) */}
                        <img src={compressedUrl} alt="Compressed" draggable={false} />

                        {/* Original (Foreground - Clipped) */}
                        <img
                            src={originalUrl}
                            alt="Original"
                            className="compare-layer-top"
                            draggable={false}
                            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        />

                        {/* Slider Handle */}
                        <div
                            className="compare-slider-handle"
                            style={{ left: `${sliderPos}%` }}
                        >
                            <div className="handle-line" />
                            <div className="handle-circle">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                    <path d="m15 18-6-6 6-6" transform="rotate(180 12 12)" />
                                </svg>
                            </div>
                        </div>

                        <div className="compare-label original">Original</div>
                        <div className="compare-label compressed">Compressed</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
