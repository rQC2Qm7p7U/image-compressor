/**
 * UI Sound Engine using Web Audio API
 * Generates subtle aesthetic ticks and pops without requiring external assets.
 */

import { useAppStore } from '../store/useAppStore';

// We initialize the context lazily so it respects browser autoplay policies (requires user interaction first).
let audioCtx: AudioContext | null = null;
let supported = true;

function getContext(): AudioContext | null {
    if (!supported) return null;
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            supported = false;
        }
    }
    return audioCtx;
}

/**
 * Play a subtle UI interaction sound
 * @param type kind of sound to play
 */
export function playUISound(type: 'click' | 'success' | 'drop' | 'error') {
    const { soundEnabled } = useAppStore.getState().settings;
    if (!soundEnabled) return;

    const ctx = getContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
        case 'click':
            // Very short, high-pitched "tick"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            osc.start(t);
            osc.stop(t + 0.05);
            break;

        case 'drop':
            // Lower, softer "bloop"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;

        case 'success':
            // Two rapid ascending tones
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
            osc.frequency.setValueAtTime(800, t + 0.05);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            
            osc.start(t);
            osc.stop(t + 0.15);
            break;

        case 'error':
            // Dull "thud"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;
    }
}
