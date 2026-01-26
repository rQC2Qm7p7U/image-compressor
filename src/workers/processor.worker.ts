/// <reference lib="webworker" />
import { encode as encodeJpeg } from '@jsquash/jpeg';
import { encode as encodeWebp } from '@jsquash/webp';

self.onmessage = async (e: MessageEvent) => {
    const { id, file, settings } = e.data;

    try {
        // 1. Decode
        // @ts-ignore
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const { width, height } = calculateSize(bitmap.width, bitmap.height, settings.resize, settings.maxWidth);

        // 2. Resize & Get ImageData
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Note: For WASM/JSquash we need Raw ImageData, so we don't need to manual white-fill for JPEG here
        // IF the encoder supports RGBA. 
        // MozJPEG usually expects RGB or handles RGBA by ignoring alpha (black) or we need to flatten.
        // JSquash JPEG usually handles 4 channels but alpha might be black.
        // Let's keep the safety fill for JPEG just in case.
        if (settings.format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // 3. Encode via WASM
        let resultBuffer: ArrayBuffer;

        if (settings.format === 'jpeg') {
            resultBuffer = await encodeJpeg(imageData, { quality: settings.quality });
        } else {
            resultBuffer = await encodeWebp(imageData, { quality: settings.quality });
        }

        // 4. Return Blob
        const blob = new Blob([resultBuffer], {
            type: settings.format === 'jpeg' ? 'image/jpeg' : 'image/webp'
        });

        self.postMessage({ id, status: 'done', blob });

    } catch (error: any) {
        console.error('Worker error:', error);
        self.postMessage({ id, status: 'error', error: error.message || 'Unknown worker error' });
    }
};

function calculateSize(srcWidth: number, srcHeight: number, shouldResize: boolean, maxWidth: number) {
    if (!shouldResize || srcWidth <= maxWidth) {
        return { width: srcWidth, height: srcHeight };
    }
    const ratio = maxWidth / srcWidth;
    return { width: maxWidth, height: srcHeight * ratio };
}
