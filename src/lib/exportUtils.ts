/// <reference types="wicg-file-system-access" />
import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';
import type { Job } from '../store/useAppStore';

// #4 — single source of truth for output filename logic
export const buildOutputFilename = (originalName: string, mimeType: string): string => {
    const ext = getExtensionFromMime(mimeType);
    const parts = originalName.split('.');
    if (parts.length > 1) parts.pop();
    return parts.join('.') + ext;
};

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
            const buffer = await job.outputBlob.arrayBuffer();
            const uint8 = new Uint8Array(buffer);
            const name = buildOutputFilename(job.file.name, job.outputBlob.type);
            data[name] = uint8;
        }
    }

    const zipped = zipSync(data);
    return new Blob([zipped] as BlobPart[], { type: 'application/zip' });
};

export const saveToFolder = async (files: Job[]) => {
    if (typeof window.showDirectoryPicker !== 'function') {
        throw new Error('File System Access API not supported');
    }

    const dirHandle = await window.showDirectoryPicker();

    let savedCount = 0;
    for (const job of files) {
        if (job.status === 'done' && job.outputBlob) {
            const name = buildOutputFilename(job.file.name, job.outputBlob.type);
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
