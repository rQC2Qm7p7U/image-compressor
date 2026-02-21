import { create } from 'zustand';

export type JobStatus = 'waiting' | 'processing' | 'done' | 'error';

export interface Job {
    id: string;
    file: File;
    previewUrl?: string; // For UI preview
    status: JobStatus;
    originalSize: number;
    compressedSize?: number;
    outputBlob?: Blob;
    error?: string;
}

export interface Settings {
    format: 'jpeg' | 'webp' | 'avif';
    quality: number; // 0-100
    resize: boolean;
    maxWidth: number;
}

interface AppState {
    files: Job[];
    settings: Settings;
    globalStatus: 'idle' | 'processing' | 'done' | 'stopped';

    // Actions
    addFiles: (newFiles: File[]) => void;
    removeFile: (id: string) => void;
    updateSettings: (settings: Partial<Settings>) => void;
    updateJob: (id: string, updates: Partial<Job>) => void;
    setGlobalStatus: (status: AppState['globalStatus']) => void;
    resetQueue: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    files: [],
    settings: {
        format: 'jpeg',
        quality: 80,
        resize: false,
        maxWidth: 1920,
    },
    globalStatus: 'idle',

    addFiles: (newFiles) => set((state) => {
        const newJobs: Job[] = newFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            originalSize: file.size,
            status: 'waiting',
            // We'll generate preview URLs in the ImportView for performance/cleanup
        }));
        return { files: [...state.files, ...newJobs] };
    }),

    removeFile: (id) => set((state) => ({
        files: state.files.filter((f) => f.id !== id),
    })),

    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
    })),

    updateJob: (id, updates) => set((state) => ({
        files: state.files.map((f) => f.id === id ? { ...f, ...updates } : f),
    })),

    setGlobalStatus: (status) => set({ globalStatus: status }),

    resetQueue: () => set({ files: [], globalStatus: 'idle' }),
}));
