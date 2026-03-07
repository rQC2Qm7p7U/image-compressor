import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { compressImage } from '../lib/imageProcessor';
import { createZipFromJobs, downloadBlob, buildOutputFilename } from '../lib/exportUtils';
import { useToast } from '../components/Toast';

export const ImportView: React.FC = () => {
    const { files, addFiles, updateJob, settings, clearAll } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { showToast } = useToast();
    const autoDownloadTriggered = useRef(false);
    const settingsRef = useRef(settings);
    settingsRef.current = settings; // always fresh reference

    // Derived counts
    const totalFiles = files.length;
    const doneCount = files.filter(f => f.status === 'done').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const isProcessing = totalFiles > 0 && doneCount + errorCount < totalFiles;
    const isFinished = totalFiles > 0 && doneCount + errorCount === totalFiles;

    const savedSavings = files.reduce((acc, f) => acc + (f.originalSize - (f.compressedSize || f.originalSize)), 0);
    const totalSize = files.reduce((acc, f) => acc + f.originalSize, 0);

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const validFiles = Array.from(fileList).filter(f =>
            f.type.startsWith('image/') ||
            f.name.toLowerCase().endsWith('.heic') ||
            f.name.toLowerCase().endsWith('.heif') ||
            f.name.toLowerCase().endsWith('.avif')
        );
        if (validFiles.length > 0) {
            autoDownloadTriggered.current = false;
            addFiles(validFiles);
        }
    };

    // Auto processing logic
    useEffect(() => {
        const pendingJobs = files.filter(f => f.status === 'waiting' || (f.status === 'error' && !f.error));
        if (pendingJobs.length === 0) return;

        // Mark all pending as processing in ONE batch to avoid race condition
        const pendingIds = new Set(pendingJobs.map(j => j.id));
        useAppStore.setState(state => ({
            files: state.files.map(f =>
                pendingIds.has(f.id) ? { ...f, status: 'processing' as const, error: undefined } : f
            )
        }));

        Promise.allSettled(
            pendingJobs.map(async (job) => {
                const blob = await compressImage(job, settingsRef.current);
                updateJob(job.id, {
                    status: 'done',
                    outputBlob: blob,
                    compressedSize: blob.size
                });
            })
        ).then(results => {
            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    const error = result.reason as Error;
                    updateJob(pendingJobs[i].id, {
                        status: 'error',
                        error: error.message || 'Unknown error'
                    });
                }
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files.length]); // Intentionally only depend on array length to avoid loops

    const handleDownloadZip = useCallback(async () => {
        const doneFiles = files.filter(f => f.status === 'done');
        if (doneFiles.length === 0) return;

        try {
            if (doneFiles.length === 1) {
                const job = doneFiles[0];
                if (job.outputBlob) {
                    downloadBlob(job.outputBlob, buildOutputFilename(job.file.name, job.outputBlob.type));
                }
            } else {
                const zipBlob = await createZipFromJobs(doneFiles);
                downloadBlob(zipBlob, 'images.zip');
            }

            // Cleanup after short delay
            setTimeout(() => clearAll(), 2500);

            let msg = `${doneFiles.length} file${doneFiles.length > 1 ? 's' : ''} compressed! `;
            if (totalSize > 0) {
                msg += `Saved ${(savedSavings / 1024 / 1024).toFixed(1)} MB (${((savedSavings / totalSize) * 100).toFixed(1)}%).`;
            }
            showToast(msg, 'success');

        } catch (e) {
            showToast('Failed to create ZIP or download file', 'error');
            console.error(e);
        }
    }, [files, showToast, clearAll, savedSavings, totalSize]);

    // Auto-download when done
    useEffect(() => {
        if (isFinished && !autoDownloadTriggered.current && doneCount > 0) {
            autoDownloadTriggered.current = true;
            handleDownloadZip();
        }
    }, [isFinished, doneCount, handleDownloadZip]);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
            {/* Drop Zone */}
            <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
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
                    cursor: isProcessing ? 'wait' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'all 0.2s',
                    flex: 1,
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
                    title="Choose images to compile"
                    accept="image/*,.heic,.heif,.avif"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={isProcessing}
                />
            </div>

            {/* Progress Bar Area */}
            {totalFiles > 0 && (
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'toast-in 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isProcessing ? <RefreshCw className="spin" size={18} color="hsl(var(--color-primary))" /> : <CheckCircle2 size={18} color="hsl(var(--color-success))" />}
                            <span style={{ fontWeight: 600 }}>
                                {isProcessing ? 'Compressing images...' : 'Compression complete'}
                            </span>
                        </div>
                        <span style={{ color: 'hsl(var(--color-text-dim))', fontSize: '0.9rem' }}>
                            {doneCount + errorCount} / {totalFiles}
                        </span>
                    </div>

                    {/* Bar */}
                    <div style={{ background: 'hsl(var(--color-bg-hover))', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: isFinished ? 'hsl(var(--color-success))' : 'hsl(var(--color-primary))',
                            width: `${((doneCount + errorCount) / totalFiles) * 100}%`,
                            transition: 'width 0.3s ease, background 0.3s ease'
                        }} />
                    </div>

                    {/* Stats when done */}
                    {isFinished && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'hsl(var(--color-text-dim))' }}>
                            <span>Saved {(savedSavings / 1024 / 1024).toFixed(1)} MB</span>
                            <span>Downloading automatically...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
