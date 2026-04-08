<div align="center">
  <h1>Image Compressor Pro (PWA)</h1>
  <p>
    <a href="https://image-compressor-leoworks.netlify.app"><img src="https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=flat-square&logo=netlify" alt="Deployed on Netlify" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  </p>
  <p>A modern, privacy-first web application for batch image compression running natively in your browser. Files never leave your device.</p>
  <h3><a href="https://image-compressor-leoworks.netlify.app">Live Demo</a></h3>
</div>

<br />

## ✨ Key Features

- **Professional Compression**: Uses native browser codecs for maximum speed (JPEG, WebP) and WebAssembly for AVIF generation.
- **Privacy-First**: No backend server. All image processing happens 100% locally on your device.
- **Batch Processing**: Handle multiple images concurrently using Web Workers (`WorkerPool` utilizes up to 4 CPU threads).
- **HEIC/HEIF Support**: Automatically converts iPhone photos to standard formats on the fly before compression.
- **Smart Export Strategy**: 
  - Downloads single files directly (`.webp`, `.jpeg`, `.avif`).
  - Automatically packages multiple files into a single `.zip` archive.
  - Built-in collision protection prevents overwriting files with the same name.
- **Adaptive UI**: Premium design with automatic Light/Dark/System theme switching to match your OS preferences. Implemented with FOUC prevention for seamless loading.
- **PWA & Offline Ready**: Installable as a standalone app via Chrome/Edge. Fully functional offline after initial load.

## 🚀 Quick Start

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+) installed.

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone https://github.com/rQC2Qm7p7U/image-compressor.git
   cd image-compressor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📱 PWA Installation

1. Open the application in **Google Chrome** or **Microsoft Edge**.
2. Click the **Install** icon on the right side of the URL address bar.
3. The app will be added to your system's application menu and can be launched offline as a native desktop window.

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework** | React 19, TypeScript, Vite 7 |
| **State Management** | Zustand (with `persist` middleware) |
| **Compression** | Native Browser Codecs (WebP, JPEG) + WASM (`@jsquash/avif`) |
| **HEIC Decoding**| `heic2any` (Client-side translation) |
| **Archiving** | `fflate` (Synchronous ZIP packing without server overhead) |
| **PWA** | `vite-plugin-pwa` (Workbox, prompt-mode updates) |
| **Styling** | CSS Variables, HSL Palette, BEM Methodology |

## 📁 Project Structure

```text
src/
├── components/       # Reusable UI components (ThemeToggle, AppFooter, Toast)
├── views/            # Main application views (ImportView, SettingsView)
├── store/            # Global state management via Zustand (useAppStore)
├── lib/              # Core business logic (imageProcessor, exportUtils)
├── workers/          # Web Workers for asynchronous WASM compression
├── index.css         # Global design system (CSS variables + BEM styling)
├── App.tsx           # Root layout and context providers
└── main.tsx          # Application entry point
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rQC2Qm7p7U/image-compressor/issues).

## 📄 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.<br />
Developed by [LeoWorks](https://www.linkedin.com/in/leoshw/).
