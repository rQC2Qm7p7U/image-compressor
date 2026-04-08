import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = 'waiting' | 'processing' | 'done' | 'error';

export interface Job {
    id: string;
    file: File;
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
    soundEnabled: boolean;
}

const DEFAULT_FORMAT: Settings['format'] = 'webp';
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_SOUND_ENABLED = true;

interface AppState {
    files: Job[];
    settings: Settings;
    // Actions
    addFiles: (newFiles: File[]) => void;
    updateSettings: (settings: Partial<Settings>) => void;
    updateJob: (id: string, updates: Partial<Job>) => void;
    clearAll: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            files: [],
            settings: {
                format: DEFAULT_FORMAT,
                quality: DEFAULT_QUALITY,
                resize: false,
                maxWidth: DEFAULT_MAX_WIDTH,
                soundEnabled: DEFAULT_SOUND_ENABLED,
            },

            addFiles: (newFiles) => set((state) => {
                const newJobs: Job[] = newFiles.map((file) => ({
                    id: crypto.randomUUID(),
                    file,
                    originalSize: file.size,
                    status: 'waiting',
                }));
                return { files: [...state.files, ...newJobs] };
            }),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings },
            })),

            updateJob: (id, updates) => set((state) => ({
                files: state.files.map((f) => f.id === id ? { ...f, ...updates } : f),
            })),

            clearAll: () => set({ files: [] }),
        }),
        {
            name: 'imgcompressor-settings',
            version: 1,
            // Only persist user settings — files and globalStatus are ephemeral
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);
