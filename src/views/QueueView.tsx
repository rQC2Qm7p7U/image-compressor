import React, { useEffect } from 'react';
import { useAppStore, type Job } from '../store/useAppStore';
import { Download, FolderInput, RefreshCw, ArrowDownAZ, ArrowUpNarrowWide, TestTube, Eye, Play, List } from 'lucide-react';
import { createZipFromJobs, downloadBlob, saveToFolder, getExtensionFromMime } from '../lib/exportUtils';
import { CompareModal } from '../components/CompareModal';
import { compressImage } from '../lib/imageProcessor';

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

    // Handlers
    const handleDownloadZip = async () => {
        const doneFiles = files.filter(f => f.status === 'done');
        if (doneFiles.length === 0) return;

        try {
            if (doneFiles.length === 1) {
                // If only one file, download it directly without zipping
                const job = doneFiles[0];
                if (job.outputBlob) {
                    let name = job.file.name;
                    const ext = getExtensionFromMime(job.outputBlob.type);
                    const nameParts = name.split('.');
                    if (nameParts.length > 1) nameParts.pop();
                    name = nameParts.join('.') + ext;

                    downloadBlob(job.outputBlob, name);
                }
            } else {
                // Multiple files, zip them
                const zipBlob = await createZipFromJobs(doneFiles);
                downloadBlob(zipBlob, 'images.zip');
            }

            // Auto-clear the queue after a short delay so the user sees completion
            setTimeout(() => {
                resetQueue();
            }, 1500);

        } catch (e) {
            alert('Failed to create ZIP or download file');
            console.error(e);
        }
    };

    // WORKER MANAGEMENT
    useEffect(() => {
        if (globalStatus === 'processing') {
            autoDownloadTriggered.current = false; // Reset trigger on new processing

            // Find ALL waiting jobs to process them in parallel (WorkerPool will handle concurrency)
            const pendingJobs = files.filter(f => f.status === 'waiting' || (f.status === 'error' && !f.error));

            if (pendingJobs.length > 0) {
                // Mark all as processing immediately using batch update
                updateJobsBatch(pendingJobs.map(job => ({
                    id: job.id,
                    updates: { status: 'processing', error: undefined }
                })));

                // Start processing all of them
                pendingJobs.forEach(async (job) => {
                    try {
                        const blob = await compressImage(job, settings);
                        updateJob(job.id, {
                            status: 'done',
                            outputBlob: blob,
                            compressedSize: blob.size
                        });
                    } catch (error: any) {
                        updateJob(job.id, { status: 'error', error: error.message || 'Unknown error' });
                    }
                });
            } else {
                // Check if all are done (no processing, no waiting)
                const isFinished = files.every(f => f.status === 'done' || f.status === 'error');
                const hasProcessing = files.some(f => f.status === 'processing');

                if (isFinished && !hasProcessing) {
                    setGlobalStatus('done');
                }
            }
        }
    }, [files, globalStatus, settings, updateJob, updateJobsBatch, setGlobalStatus]);

    // AUTO-DOWNLOAD
    useEffect(() => {
        if (globalStatus === 'done' && files.length > 0 && !autoDownloadTriggered.current) {
            // Check if there are actually any successfully processed files
            const doneFiles = files.filter(f => f.status === 'done');
            if (doneFiles.length > 0) {
                autoDownloadTriggered.current = true;
                handleDownloadZip();
            }
        }
    }, [globalStatus, files]);

    const handleTestFirst = async () => {
        // Find first waiting job
        const first = files.find(f => f.status === 'waiting');
        if (first) {
            updateJob(first.id, { status: 'processing' });
            try {
                const blob = await compressImage(first, settings);
                updateJob(first.id, {
                    status: 'done',
                    outputBlob: blob,
                    compressedSize: blob.size
                });
            } catch (error: any) {
                updateJob(first.id, { status: 'error', error: error.message || 'Unknown error' });
            }
        }
    };

    const handleStartProcessing = () => {
        setGlobalStatus('processing');
    };

    const sortedFiles = React.useMemo(() => sortFiles(files, sortMode), [files, sortMode]);
    const savings = React.useMemo(() => files.reduce((acc, f) => acc + (f.originalSize - (f.compressedSize || f.originalSize)), 0), [files]);
    const totalSize = React.useMemo(() => files.reduce((acc, f) => acc + f.originalSize, 0), [files]);
    const savedPercent = totalSize > 0 ? (savings / totalSize) * 100 : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Header Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Processing Queue</h2>
                    <p style={{ color: 'hsl(var(--color-text-dim))' }}>{files.filter(f => f.status === 'done').length} / {files.length} completed</p>
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
                        width: `${(files.filter(f => f.status === 'done').length / files.length) * 100}%`,
                        transition: 'width 0.3s'
                    }}
                />
            </div>

            {/* Actions Bar (Start / Test) */}
            {globalStatus === 'idle' && files.some(f => f.status === 'waiting') && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartProcessing}
                        title="Start processing all images in queue"
                    >
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
                    const itemSavings = job.compressedSize ? ((job.originalSize - job.compressedSize) / job.originalSize * 100).toFixed(1) : 0;
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
                            {/* Status Icon */}
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
                                            style={{ padding: '0.4rem', height: 'auto' }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </>
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
                    disabled={files.filter(f => f.status === 'done').length === 0}
                    onClick={handleDownloadZip}
                    title="Download all compressed images as ZIP"
                >
                    <Download size={18} /> Download All
                </button>
                <button
                    className="btn"
                    style={{ flex: 1 }}
                    disabled={files.filter(f => f.status === 'done').length === 0}
                    onClick={async () => {
                        try {
                            const doneFiles = files.filter(f => f.status === 'done');
                            await saveToFolder(doneFiles);
                            alert('Files saved successfully!');

                            // Auto-clear the queue after a short delay
                            setTimeout(() => {
                                resetQueue();
                            }, 1500);
                        } catch (e: any) {
                            if (e.message?.includes('not supported')) {
                                alert('This feature is only available in Chrome/Edge on Desktop.');
                            } else {
                                console.error(e);
                                alert('Failed to save to folder. Try ZIP download instead.');
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

// Add simple spin animation to global css or inline here
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);
