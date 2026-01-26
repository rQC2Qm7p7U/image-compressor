import type { Job, Settings } from '../store/useAppStore';

const MAX_CONCURRENCY = navigator.hardwareConcurrency ? Math.min(4, navigator.hardwareConcurrency - 1) : 2;

class WorkerPool {
    private workers: Worker[] = [];
    private idleWorkers: Worker[] = [];
    private queue: Array<(worker: Worker) => void> = [];

    constructor(size: number) {
        for (let i = 0; i < size; i++) {
            const worker = new Worker(new URL('../workers/processor.worker.ts', import.meta.url), { type: 'module' });
            this.workers.push(worker);
            this.idleWorkers.push(worker);
        }
    }

    run(task: (worker: Worker) => Promise<any>): Promise<any> {
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
}

// Singleton instance
export const imageEngine = new WorkerPool(MAX_CONCURRENCY);

export const compressImage = (job: Job, settings: Settings): Promise<Blob> => {
    return imageEngine.run((worker) => {
        return new Promise((resolve, reject) => {
            const handler = (e: MessageEvent) => {
                const { id, status, blob, error } = e.data;
                if (id !== job.id) return;

                worker.removeEventListener('message', handler);
                if (status === 'done') resolve(blob);
                else reject(new Error(error));
            };

            worker.addEventListener('message', handler);
            worker.postMessage({
                id: job.id,
                file: job.file,
                settings
            });
        });
    });
};
