import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Upload, X, FileImage, ArrowRight } from 'lucide-react';

interface ImportViewProps {
    onNext: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onNext }) => {
    const { files, addFiles, removeFile } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            addFiles(validFiles);
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

    const totalSize = files.reduce((acc, f) => acc + f.originalSize, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
            {/* Drop Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                style={{
                    border: '2px dashed ' + (isDragging ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'),
                    borderRadius: 'var(--radius-md)',
                    padding: '3rem',
                    textAlign: 'center',
                    background: isDragging ? 'hsl(var(--color-bg-hover))' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    minHeight: files.length === 0 ? '300px' : '200px',
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

            {/* File List */}
            {files.length > 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            Selected Images <span style={{ color: 'hsl(var(--color-text-dim))', fontWeight: 400 }}>({files.length})</span>
                        </h3>
                        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-dim))' }}>
                            Total: {(totalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: '0.5rem',
                        overflowY: 'auto',
                        maxHeight: '300px',
                        paddingRight: '0.5rem'
                    }}>
                        {files.map((job) => (
                            <div key={job.id} className="card" style={{ position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                                {/* Note: In a real app we'd create object URLs for previews, but for now just showing an icon to avoid memory leaks if we don't clean up. 
                     We can add proper thumbnails later if needed. */}
                                <FileImage size={32} color="hsl(var(--color-text-dim))" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(job.id); }}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        background: 'rgba(0,0,0,0.6)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    padding: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textAlign: 'center'
                                }}>
                                    {job.file.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={onNext}>
                            Continue to Settings <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
