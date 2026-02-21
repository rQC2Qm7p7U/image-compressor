import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';
import type { Job } from '../store/useAppStore';

export const getExtensionFromMime = (mimeType: string): string => {
    if (mimeType.includes('webp')) return '.webp';
    if (mimeType.includes('avif')) return '.avif';
    if (mimeType.includes('png')) return '.png';
    return '.jpg';
};

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
            const ext = getExtensionFromMime(job.outputBlob.type);

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
    if (typeof (window as any).showDirectoryPicker !== 'function') {
        throw new Error('File System Access API not supported');
    }

    const dirHandle = await (window as any).showDirectoryPicker();

    let savedCount = 0;
    for (const job of files) {
        if (job.status === 'done' && job.outputBlob) {
            let name = job.file.name;
            const ext = getExtensionFromMime(job.outputBlob.type);
            const nameParts = name.split('.');
            if (nameParts.length > 1) nameParts.pop();
            name = nameParts.join('.') + ext;

            const fileHandle = await dirHandle.getFileHandle(name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(job.outputBlob);
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
