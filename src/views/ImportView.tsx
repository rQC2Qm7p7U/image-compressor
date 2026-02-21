import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Upload } from 'lucide-react';

interface ImportViewProps {
    onFilesAdded: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onFilesAdded }) => {
    const { addFiles } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            addFiles(validFiles);
            onFilesAdded();
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
            {/* Drop Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                title="Click to select files or drag them here"
                style={{
                    border: '2px dashed ' + (isDragging ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'),
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    textAlign: 'center',
                    background: isDragging ? 'hsl(var(--color-bg-hover))' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.8rem',
                    minHeight: '200px',
                    justifyContent: 'center'
                }}
            >
                <div style={{
                    background: 'hsl(var(--color-bg-hover))',
                    padding: '1rem',
                    borderRadius: '50%',
                    color: 'hsl(var(--color-primary))'
                }}>
                    <Upload size={32} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drag & Drop images here</h3>
                    <p style={{ color: 'hsl(var(--color-text-dim))' }}>or click to browse</p>
                </div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>
        </div>
    );
};
