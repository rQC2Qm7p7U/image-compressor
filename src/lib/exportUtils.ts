import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';
import type { Job } from '../store/useAppStore';

export const createZipFromJobs = async (files: Job[]): Promise<Blob> => {
    const data: Zippable = {};

    for (const job of files) {
        if (job.status === 'done' && job.outputBlob) {
            // Convert Blob to Uint8Array for fflate (synchronous zipSync is easiest for small batches)
            // For large batches, async zip with worker is better, but fflate is fast.
            // Let's use async reading of blob.

            const buffer = await job.outputBlob.arrayBuffer();
            const uint8 = new Uint8Array(buffer);

            // Determine filename extension
            let name = job.file.name;
            const ext = job.outputBlob.type === 'image/webp' ? '.webp' : '.jpg';

            // Replace old extension or append?
            // "image.png" -> "image.webp"
            const nameParts = name.split('.');
            if (nameParts.length > 1) nameParts.pop();
            name = nameParts.join('.') + ext;

            data[name] = uint8;
        }
    }

    const zipped = zipSync(data);
    return new Blob([zipped] as BlobPart[], { type: 'application/zip' });
};

export const saveToFolder = async (files: Job[]) => {
    // @ts-ignore - Types for showDirectoryPicker might not be in default lib
    if (typeof window.showDirectoryPicker !== 'function') {
        throw new Error('File System Access API not supported');
    }

    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker();

    let savedCount = 0;
    for (const job of files) {
        if (job.status === 'done' && job.outputBlob) {
            let name = job.file.name;
            const ext = job.outputBlob.type === 'image/webp' ? '.webp' : '.jpg';
            const nameParts = name.split('.');
            if (nameParts.length > 1) nameParts.pop();
            name = nameParts.join('.') + ext;

            // @ts-ignore
            const fileHandle = await dirHandle.getFileHandle(name, { create: true });
            // @ts-ignore
            const writable = await fileHandle.createWritable();
            // @ts-ignore
            await writable.write(job.outputBlob);
            // @ts-ignore
            await writable.close();
            savedCount++;
        }
    }
    return savedCount;
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
