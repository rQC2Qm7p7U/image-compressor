# Roadmap: Image Compressor v2.0+

## 1. Engine 2.0: Professional Quality (WASM) [CURRENT PRIORITY]
Migration from `canvas.toBlob` (User Agent encoding) to proper WebAssembly codecs.
- **Goal**: Predictable quality, transparency handling, smaller file sizes, no "black background" issues.
- **Tools**: `@jsquash/jpeg` (MozJPEG), `@jsquash/webp` (WebP).
- **Tasks**:
    - [ ] Install WASM libraries.
    - [ ] Refactor Web Worker to use WASM modules.
    - [ ] Ensure correct serving of `.wasm` files in Vite.

## 2. UI 2.0: Visual Inspection
- **Before/After Slider**: Split-view component to compare original vs compressed pixels.
- **Zoom / Pan**: Ability to inspect details.

## 3. Workflow Improvements
- **Benchmarks**: "Calculate estimated size" button.
- **Presets**: Buttons for "Web", "Email", "Max Quality".
- **Sorting & Filtering**: Sort queue by size, name, status.

## 4. Advanced Export
- **Preserve Directory Structure**: When dropping folders, keep the hierarchy in the output ZIP/Folder.
- **Watermarking**: Canvas-based overlay for logos/text.
