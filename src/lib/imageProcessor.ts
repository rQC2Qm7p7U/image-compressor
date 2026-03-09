import type { Job, Settings } from '../store/useAppStore';
import heic2any from 'heic2any';

/** Prevent spawning too many workers even on high-core machines */
const MAX_CONCURRENCY_CAP = 4;
const FALLBACK_CONCURRENCY = 2;

const MAX_CONCURRENCY = navigator.hardwareConcurrency
    ? Math.min(MAX_CONCURRENCY_CAP, navigator.hardwareConcurrency - 1)
    : FALLBACK_CONCURRENCY;

class WorkerPool {
    private workers: Worker[] = [];
    private idleWorkers: Worker[] = [];
    private queue: Array<(worker: Worker) => void> = [];

    constructor(size: number) {
        for (let i = 0; i < size; i++) {
            const worker = new Worker(
                new URL('../workers/processor.worker.ts', import.meta.url),
                { type: 'module' }
            );
            this.workers.push(worker);
            this.idleWorkers.push(worker);
        }
    }

    run(task: (worker: Worker) => Promise<unknown>): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const execute = async (worker: Worker) => {
                try {
                    const result = await task(worker);
                    resolve(result);
                } catch (err) {
                    reject(err);
                } finally {
                    this.idleWorkers.push(worker);
                    this.processQueue();
                }
            };

            if (this.idleWorkers.length > 0) {
                const worker = this.idleWorkers.pop()!;
                execute(worker);
            } else {
                this.queue.push(execute);
            }
        });
    }

    private processQueue() {
        if (this.queue.length > 0 && this.idleWorkers.length > 0) {
            const execute = this.queue.shift()!;
            const worker = this.idleWorkers.pop()!;
            execute(worker);
        }
    }

    // #8 — terminate all workers (cleanup on app unmount or test teardown)
    terminate() {
        this.queue.length = 0;
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.idleWorkers = [];
    }
}

// Singleton instance
export const imageEngine = new WorkerPool(MAX_CONCURRENCY);

// Cleanup workers on HMR to prevent leaks during development
if (import.meta.hot) {
    import.meta.hot.dispose(() => imageEngine.terminate());
}

export const compressImage = async (job: Job, settings: Settings): Promise<Blob> => {
    let fileToProcess: File | Blob = job.file;

    // Pre-convert HEIC/HEIF on the main thread since heic2any requires DOM canvas
    const isHeic =
        job.file.type === 'image/heic' ||
        job.file.type === 'image/heif' ||
        job.file.name.toLowerCase().endsWith('.heic') ||
        job.file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
        try {
            const converted = await heic2any({ blob: job.file, toType: 'image/jpeg' });
            fileToProcess = Array.isArray(converted) ? converted[0] : converted;
        } catch (err) {
            console.error('Failed to convert HEIC to JPEG', err);
            throw new Error('Failed to parse HEIC file');
        }
    }

    return imageEngine.run((worker) => {
        return new Promise<Blob>((resolve, reject) => {
            const handler = (e: MessageEvent) => {
                const { id, status, blob, error } = e.data;
                if (id !== job.id) return;

                worker.removeEventListener('message', handler);
                if (status === 'done') {
                    const fallbackType =
                        settings.format === 'jpeg' ? 'image/jpeg' :
                            settings.format === 'avif' ? 'image/avif' : 'image/webp';
                    const typedBlob = new Blob([blob], { type: blob.type || fallbackType });
                    resolve(typedBlob);
                } else {
                    reject(new Error(error));
                }
            };

            worker.addEventListener('message', handler);
            worker.postMessage({ id: job.id, file: fileToProcess, settings });
        });
    }) as Promise<Blob>;
};
