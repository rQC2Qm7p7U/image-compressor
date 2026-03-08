/// <reference lib="webworker" />
import { encode as encodeAvif } from '@jsquash/avif';

self.onmessage = async (e: MessageEvent) => {
    const { id, file, settings } = e.data;

    try {
        // 1. Decode
        const bitmap = await createImageBitmap(file as ImageBitmapSource, { imageOrientation: 'from-image' });
        const { width, height } = calculateSize(bitmap.width, bitmap.height, settings.resize, settings.maxWidth);

        // 2. Resize & draw onto OffscreenCanvas
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Fill white background for JPEG (no alpha channel support)
        if (settings.format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(bitmap, 0, 0, width, height);

        // Free bitmap memory immediately
        bitmap.close();

        // 3. Encode
        let resultBlob: Blob;

        if (settings.format === 'avif') {
            // AVIF: no native browser support → use WASM encoder
            const imageData = ctx.getImageData(0, 0, width, height);
            const resultBuffer = await encodeAvif(imageData, { quality: settings.quality });
            resultBlob = new Blob([resultBuffer], { type: 'image/avif' });
        } else {
            // WebP & JPEG: use native browser encoder (3–5× faster than WASM)
            const mimeType = settings.format === 'jpeg' ? 'image/jpeg' : 'image/webp';
            resultBlob = await canvas.convertToBlob({
                type: mimeType,
                quality: settings.quality / 100, // convertToBlob uses 0–1 scale
            });
        }

        // 4. Return Blob
        self.postMessage({ id, status: 'done', blob: resultBlob });

    } catch (error: unknown) {
        console.error('Worker error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown worker error';
        self.postMessage({ id, status: 'error', error: msg });
    }
};

function calculateSize(srcWidth: number, srcHeight: number, shouldResize: boolean, maxWidth: number) {
    if (!shouldResize || srcWidth <= maxWidth) {
        return { width: srcWidth, height: srcHeight };
    }
    const ratio = maxWidth / srcWidth;
    return { width: maxWidth, height: Math.round(srcHeight * ratio) };
}
