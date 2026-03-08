import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Upload, RefreshCw, CheckCircle2, AlertCircle, FileImage } from 'lucide-react';
import { compressImage } from '../lib/imageProcessor';
import { createZipFromJobs, downloadBlob, buildOutputFilename } from '../lib/exportUtils';
import { useToast } from '../components/Toast';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const ImportView: React.FC = () => {
    const { files, addFiles, updateJob, settings, clearAll } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { showToast } = useToast();
    const autoDownloadTriggered = useRef(false);
    const settingsRef = useRef(settings);
    settingsRef.current = settings; // always fresh reference

    // Count waiting jobs — used as the effect trigger
    const waitingCount = useMemo(() => files.filter(f => f.status === 'waiting').length, [files]);

    // Derived counts — cached with useMemo to avoid O(n) on every render
    const { totalFiles, doneCount, errorCount, savedSavings, totalSize } = useMemo(() => {
        let done = 0, errors = 0, savings = 0, total = 0;
        for (const f of files) {
            if (f.status === 'done') done++;
            if (f.status === 'error') errors++;
            savings += f.originalSize - (f.compressedSize || f.originalSize);
            total += f.originalSize;
        }
        return { totalFiles: files.length, doneCount: done, errorCount: errors, savedSavings: savings, totalSize: total };
    }, [files]);

    const isProcessing = totalFiles > 0 && doneCount + errorCount < totalFiles;
    const isFinished = totalFiles > 0 && doneCount + errorCount === totalFiles;
    const progressPercent = totalFiles > 0 ? Math.round(((doneCount + errorCount) / totalFiles) * 100) : 0;

    const handleFiles = useCallback((fileList: FileList | null) => {
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
    }, [addFiles]);

    // Auto processing — triggers whenever new 'waiting' jobs appear
    // Uses waitingCount as dependency instead of fragile batch-ref (StrictMode-safe)
    useEffect(() => {
        if (waitingCount === 0) return;

        // Read latest state directly to avoid stale closures
        const currentFiles = useAppStore.getState().files;
        const pendingJobs = currentFiles.filter(f => f.status === 'waiting');
        if (pendingJobs.length === 0) return;

        // Mark all pending as processing in ONE batch
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
            // Batch all error updates into a single setState
            const errorUpdates: Array<{ id: string; error: string }> = [];
            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    const error = result.reason as Error;
                    errorUpdates.push({
                        id: pendingJobs[i].id,
                        error: error.message || 'Unknown error'
                    });
                }
            });

            if (errorUpdates.length > 0) {
                const errorIds = new Map(errorUpdates.map(e => [e.id, e.error]));
                useAppStore.setState(state => ({
                    files: state.files.map(f =>
                        errorIds.has(f.id)
                            ? { ...f, status: 'error' as const, error: errorIds.get(f.id) }
                            : f
                    )
                }));
            }
        });
    }, [waitingCount, updateJob]);

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

    const dropZoneClass = `drop-zone${isDragging ? ' dragging' : ''}${isProcessing ? ' processing' : ''}`;

    return (
        <div className="import-view">
            {/* Drop Zone */}
            <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                title="Click to select files or drag them here"
                className={dropZoneClass}
            >
                <div className="drop-zone__icon">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="drop-zone__title">Drag & Drop images here</h3>
                    <p className="drop-zone__hint">or click to browse</p>
                </div>
                <input
                    type="file"
                    multiple
                    title="Choose images to compile"
                    accept="image/*,.heic,.heif,.avif"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                    disabled={isProcessing}
                />
            </div>

            {/* Progress Area */}
            {totalFiles > 0 && (
                <div className="card progress-card">
                    {/* Header */}
                    <div className="progress-header">
                        <div className="progress-label">
                            {isProcessing
                                ? <RefreshCw className="spin" size={18} color="hsl(var(--color-primary))" />
                                : <CheckCircle2 size={18} color="hsl(var(--color-success))" />
                            }
                            <span className="progress-label__text">
                                {isProcessing ? 'Compressing images...' : 'Compression complete'}
                            </span>
                        </div>
                        <span className="progress-counter">
                            {doneCount + errorCount} / {totalFiles}
                        </span>
                    </div>

                    {/* Bar with percentage */}
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar">
                            <div
                                className={`progress-bar__fill${isFinished ? ' done' : ''}${isProcessing ? ' shimmer' : ''}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="progress-percent">{progressPercent}%</span>
                    </div>

                    {/* Per-file list */}
                    <div className="progress-files">
                        {files.map(f => (
                            <div key={f.id} className={`progress-file progress-file--${f.status}`}>
                                <div className="progress-file__icon">
                                    {f.status === 'done' && <CheckCircle2 size={14} />}
                                    {f.status === 'error' && <AlertCircle size={14} />}
                                    {(f.status === 'processing' || f.status === 'waiting') && <FileImage size={14} />}
                                </div>
                                <span className="progress-file__name" title={f.file.name}>
                                    {f.file.name}
                                </span>
                                <span className="progress-file__size">
                                    {formatBytes(f.originalSize)}
                                    {f.status === 'done' && f.compressedSize != null && (
                                        <> → {formatBytes(f.compressedSize)}</>
                                    )}
                                </span>
                                {f.status === 'error' && f.error && (
                                    <span className="progress-file__error" title={f.error}>Error</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Stats when done */}
                    {isFinished && (
                        <div className="progress-stats">
                            <span>Saved {(savedSavings / 1024 / 1024).toFixed(1)} MB ({totalSize > 0 ? ((savedSavings / totalSize) * 100).toFixed(1) : 0}%)</span>
                            <span>Downloading automatically...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
