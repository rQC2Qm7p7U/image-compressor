import React, { useEffect, useCallback } from 'react';
import { useAppStore, type Job } from '../store/useAppStore';
import { Download, FolderInput, RefreshCw, ArrowDownAZ, ArrowUpNarrowWide, TestTube, Eye, Play, List } from 'lucide-react';
import { createZipFromJobs, downloadBlob, saveToFolder, buildOutputFilename } from '../lib/exportUtils';
import { CompareModal } from '../components/CompareModal';
import { compressImage } from '../lib/imageProcessor';
import { useToast } from '../components/Toast';

type SortMode = 'original' | 'name' | 'size-desc';

const sortFiles = (files: Job[], mode: SortMode): Job[] => {
    switch (mode) {
        case 'name':
            return [...files].sort((a, b) => a.file.name.localeCompare(b.file.name));
        case 'size-desc':
            return [...files].sort((a, b) => b.originalSize - a.originalSize);
        default:
            return files;
    }
};

export const QueueView: React.FC = () => {
    const { files, globalStatus, updateJob, updateJobsBatch, setGlobalStatus, settings, resetQueue } = useAppStore();
    const [compareJob, setCompareJob] = React.useState<string | null>(null);
    const [sortMode, setSortMode] = React.useState<SortMode>('original');
    const autoDownloadTriggered = React.useRef(false);
    const { showToast } = useToast();

    // #4 — use shared buildOutputFilename utility
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

            setTimeout(() => resetQueue(), 1500);

        } catch (e) {
            // #9 — toast instead of alert
            showToast('Failed to create ZIP or download file', 'error');
            console.error(e);
        }
    }, [files, resetQueue, showToast]);

    // #2 — use Promise.allSettled instead of forEach(async)
    // #5 — depend on derived values (status counts) instead of full files array
    const doneCount = files.filter(f => f.status === 'done').length;
    const waitingCount = files.filter(f => f.status === 'waiting').length;
    const processingCount = files.filter(f => f.status === 'processing').length;

    useEffect(() => {
        if (globalStatus !== 'processing') return;

        autoDownloadTriggered.current = false;

        const pendingJobs = files.filter(f => f.status === 'waiting' || (f.status === 'error' && !f.error));

        if (pendingJobs.length > 0) {
            updateJobsBatch(pendingJobs.map(job => ({
                id: job.id,
                updates: { status: 'processing', error: undefined }
            })));

            // #2 — Promise.allSettled handles all rejections properly
            Promise.allSettled(
                pendingJobs.map(async (job) => {
                    const blob = await compressImage(job, settings);
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

        } else if (waitingCount === 0 && processingCount === 0) {
            // #5 — use derived counts, not full files reference
            setGlobalStatus('done');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalStatus, waitingCount, processingCount]);

    // AUTO-DOWNLOAD
    useEffect(() => {
        if (globalStatus === 'done' && doneCount > 0 && !autoDownloadTriggered.current) {
            autoDownloadTriggered.current = true;
            handleDownloadZip();
        }
    }, [globalStatus, doneCount, handleDownloadZip]);

    const handleTestFirst = async () => {
        const first = files.find(f => f.status === 'waiting');
        if (first) {
            updateJob(first.id, { status: 'processing' });
            try {
                const blob = await compressImage(first, settings);
                updateJob(first.id, { status: 'done', outputBlob: blob, compressedSize: blob.size });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                updateJob(first.id, { status: 'error', error: message });
            }
        }
    };

    const handleStartProcessing = () => setGlobalStatus('processing');

    const sortedFiles = React.useMemo(() => sortFiles(files, sortMode), [files, sortMode]);
    const savings = React.useMemo(() =>
        files.reduce((acc, f) => acc + (f.originalSize - (f.compressedSize || f.originalSize)), 0),
        [files]);
    const totalSize = React.useMemo(() => files.reduce((acc, f) => acc + f.originalSize, 0), [files]);
    const savedPercent = totalSize > 0 ? (savings / totalSize) * 100 : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Header Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Processing Queue</h2>
                    <p style={{ color: 'hsl(var(--color-text-dim))' }}>{doneCount} / {files.length} completed</p>
                </div>

                {/* Sorting Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--color-bg-card))', padding: '0.25rem', borderRadius: '6px' }}>
                    <button
                        className={`btn icon-btn ${sortMode === 'original' ? 'active' : ''}`}
                        onClick={() => setSortMode('original')}
                        title="Original Order"
                        style={{ opacity: sortMode === 'original' ? 1 : 0.5 }}
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`btn icon-btn ${sortMode === 'name' ? 'active' : ''}`}
                        onClick={() => setSortMode('name')}
                        title="Sort by Name (A-Z)"
                        style={{ opacity: sortMode === 'name' ? 1 : 0.5 }}
                    >
                        <ArrowDownAZ size={18} />
                    </button>
                    <button
                        className={`btn icon-btn ${sortMode === 'size-desc' ? 'active' : ''}`}
                        onClick={() => setSortMode('size-desc')}
                        title="Sort by Size (Largest First)"
                        style={{ opacity: sortMode === 'size-desc' ? 1 : 0.5 }}
                    >
                        <ArrowUpNarrowWide size={18} />
                    </button>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div className="stat-value" style={{ color: 'hsl(var(--color-primary))' }}>{savedPercent.toFixed(1)}%</div>
                    <div className="stat-label">Total Saved</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: 'hsl(var(--color-bg))', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        background: 'hsl(var(--color-primary))',
                        width: `${(doneCount / files.length) * 100}%`,
                        transition: 'width 0.3s'
                    }}
                />
            </div>

            {/* Actions Bar */}
            {globalStatus === 'idle' && waitingCount > 0 && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleStartProcessing} title="Start processing all images in queue">
                        <Play size={18} fill="currentColor" /> Start Queue
                    </button>
                    <button
                        className="btn"
                        onClick={handleTestFirst}
                        title="Process only the first image to verify settings"
                        style={{ border: '1px solid hsl(var(--color-primary))', color: 'hsl(var(--color-primary))' }}
                    >
                        <TestTube size={18} /> Test First Image
                    </button>
                </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sortedFiles.map(job => {
                    const itemSavings = job.compressedSize
                        ? ((job.originalSize - job.compressedSize) / job.originalSize * 100).toFixed(1)
                        : 0;
                    return (
                        <div key={job.id} className="card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            gap: '1rem',
                            borderLeft: job.status === 'processing' ? '4px solid hsl(var(--color-primary))' :
                                job.status === 'done' ? '4px solid hsl(var(--color-success))' :
                                    '4px solid transparent'
                        }}>
                            {/* Status dot */}
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: job.status === 'done' ? 'hsl(var(--color-success))' :
                                    job.status === 'processing' ? 'hsl(var(--color-primary))' :
                                        job.status === 'error' ? 'hsl(var(--color-error))' : 'hsl(var(--color-border))'
                            }} />

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>{job.file.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-dim))' }}>
                                    {(job.originalSize / 1024).toFixed(1)} KB
                                </div>
                            </div>

                            {/* Result Stats */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                {job.status === 'done' && (
                                    <>
                                        <span>{(job.compressedSize! / 1024).toFixed(1)} KB</span>
                                        <span style={{ color: 'hsl(var(--color-success))' }}>({itemSavings}%)</span>
                                        <button
                                            className="btn icon-btn"
                                            onClick={() => setCompareJob(job.id)}
                                            title="Compare with Original"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </>
                                )}
                                {job.status === 'error' && (
                                    <span style={{ color: 'hsl(var(--color-error))', fontSize: '0.8rem' }}>{job.error}</span>
                                )}
                            </div>
                            {job.status === 'processing' && <RefreshCw className="spin" size={20} />}
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-border))' }}>
                <button
                    className="btn btn-primary"
                    disabled={doneCount === 0}
                    onClick={handleDownloadZip}
                    title="Download all compressed images as ZIP"
                >
                    <Download size={18} /> Download All
                </button>
                <button
                    className="btn"
                    style={{ flex: 1 }}
                    disabled={doneCount === 0}
                    onClick={async () => {
                        try {
                            const doneFiles = files.filter(f => f.status === 'done');
                            const count = await saveToFolder(doneFiles);
                            // #9 — toast instead of alert
                            showToast(`${count} file${count !== 1 ? 's' : ''} saved successfully!`, 'success');
                            setTimeout(() => resetQueue(), 1500);
                        } catch (e: unknown) {
                            const msg = e instanceof Error ? e.message : '';
                            if (msg.includes('not supported')) {
                                showToast('Save to Folder is only available in Chrome/Edge on Desktop.', 'error');
                            } else {
                                console.error(e);
                                showToast('Failed to save to folder. Try ZIP download instead.', 'error');
                            }
                        }
                    }}
                >
                    <FolderInput size={18} /> Save to Folder...
                </button>
            </div>

            {/* Compare Modal */}
            {compareJob && (
                <CompareModal
                    isOpen={!!compareJob}
                    onClose={() => setCompareJob(null)}
                    originalFile={files.find(f => f.id === compareJob)?.file || null}
                    compressedBlob={files.find(f => f.id === compareJob)?.outputBlob || null}
                />
            )}
        </div>
    );
};
