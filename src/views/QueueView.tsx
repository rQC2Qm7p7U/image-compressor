import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Download, FolderInput, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { compressImage } from '../lib/imageProcessor';
import { createZipFromJobs, downloadBlob, saveToFolder } from '../lib/exportUtils';

export const QueueView: React.FC = () => {
    const { files, globalStatus, updateJob, setGlobalStatus, resetQueue, settings } = useAppStore();

    // WORKER MANAGEMENT
    useEffect(() => {
        if (globalStatus !== 'processing') return;

        const processQueue = async () => {
            // Find all waiting jobs
            const jobsToProcess = files.filter(f => f.status === 'waiting' || f.status === 'error');

            // If no jobs to process but we are in processing state, maybe we are done?
            if (jobsToProcess.length === 0) {
                // Check if any is processing?
                const isProcessing = files.some(f => f.status === 'processing');
                if (!isProcessing) {
                    setGlobalStatus('done');
                }
                return;
            }

            // Process tasks in parallel using the engine (which handles concurrency)
            // We map all waiting jobs to promises
            await Promise.all(jobsToProcess.map(async (job) => {
                // Double check status incase of race
                if (job.status !== 'waiting' && job.status !== 'error') return;

                updateJob(job.id, { status: 'processing', error: undefined });

                try {
                    const blob = await compressImage(job, settings);
                    updateJob(job.id, {
                        status: 'done',
                        compressedSize: blob.size,
                        outputBlob: blob
                    });
                } catch (e: any) {
                    console.error('Job failed', e);
                    updateJob(job.id, { status: 'error', error: e.message || 'Failed' });
                }
            }));

            setGlobalStatus('done');
        };

        processQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalStatus]);

    const handleDownloadZip = async () => {
        const doneFiles = files.filter(f => f.status === 'done');
        if (doneFiles.length === 0) return;

        try {
            const zipBlob = await createZipFromJobs(doneFiles);
            downloadBlob(zipBlob, 'images.zip');
        } catch (e) {
            alert('Failed to create ZIP');
            console.error(e);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Processing Queue</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {globalStatus === 'done' && (
                        <button className="btn" onClick={resetQueue}>
                            <Trash2 size={16} /> Clear All
                        </button>
                    )}
                    {globalStatus === 'processing' && (
                        <button className="btn" onClick={() => setGlobalStatus('stopped')}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (Global) */}
            <div style={{ background: 'hsl(var(--color-bg))', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    background: 'hsl(var(--color-primary))',
                    width: `${(files.filter(f => f.status === 'done').length / files.length) * 100}%`,
                    transition: 'width 0.3s'
                }} />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {files.map((job) => {
                    const savings = job.compressedSize
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
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {job.file.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-dim))', display: 'flex', gap: '1rem', marginTop: '4px' }}>
                                    <span>{(job.originalSize / 1024).toFixed(1)} KB</span>
                                    {job.status === 'done' && (
                                        <>
                                            <ArrowRight size={12} />
                                            <span style={{ color: 'hsl(var(--color-success))' }}>{(job.compressedSize! / 1024).toFixed(1)} KB</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {job.status === 'done' && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'hsl(var(--color-success))', fontWeight: 700 }}>{Number(savings) > 0 ? '-' : '+'}{Math.abs(Number(savings))}%</div>
                                </div>
                            )}

                            {job.status === 'processing' && <RefreshCw className="spin" size={20} />}
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-border))' }}>
                <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={files.filter(f => f.status === 'done').length === 0}
                    onClick={handleDownloadZip}
                >
                    <Download size={18} /> Download All (ZIP)
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
                        } catch (e: any) {
                            if (e.message.includes('not supported')) {
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
