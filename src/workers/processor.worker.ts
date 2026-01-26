/// <reference lib="webworker" />

self.onmessage = async (e: MessageEvent) => {
    const { id, file, settings } = e.data;

    try {
        // Attempt to handle EXIF orientation automatically
        // @ts-ignore - TS might be strict about options depending on lib version
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const { width, height } = calculateSize(bitmap.width, bitmap.height, settings.resize, settings.maxWidth);

        // Check for OffscreenCanvas support
        if (typeof OffscreenCanvas !== 'undefined') {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Handle transparency for JPEG
            if (settings.format === 'jpeg') {
                ctx.fillStyle = '#FFFFFF'; // White background
                ctx.fillRect(0, 0, width, height);
            }

            // Draw and resize
            ctx.drawImage(bitmap, 0, 0, width, height);

            // Convert to blob
            // Note: OffscreenCanvas.convertToBlob takes { type, quality }
            const blob = await canvas.convertToBlob({
                type: settings.format === 'jpeg' ? 'image/jpeg' : 'image/webp',
                quality: settings.quality / 100
            });

            // Send back result
            self.postMessage({ id, status: 'done', blob });
        } else {
            // Fallback logic if needed, or error out if we strictly want worker only.
            // For a modern PWA targeting Chrome/Edge/Mac, OffscreenCanvas is available.
            throw new Error('OffscreenCanvas not supported in this browser.');
        }
    } catch (error: any) {
        self.postMessage({ id, status: 'error', error: error.message });
    }
};

function calculateSize(srcWidth: number, srcHeight: number, shouldResize: boolean, maxWidth: number) {
    if (!shouldResize || srcWidth <= maxWidth) {
        return { width: srcWidth, height: srcHeight };
    }
    const ratio = maxWidth / srcWidth;
    return { width: maxWidth, height: srcHeight * ratio };
}
