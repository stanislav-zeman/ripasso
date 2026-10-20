export type Cue = 'correct' | 'almost' | 'wrong' | 'complete';

interface SoundSettings {
	/** 0–1, applied on a curve so the slider feels even. */
	volume: number;
	muted: boolean;
}

const KEY = 'ripasso:sound';
const defaults: SoundSettings = { volume: 0.6, muted: false };

function load(): SoundSettings {
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		return {
			volume:
				typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : defaults.volume,
			muted: typeof saved.muted === 'boolean' ? saved.muted : defaults.muted
		};
	} catch {
		return { ...defaults };
	}
}

/** Sound effect settings, remembered in this browser. */
export const sound: SoundSettings = $state(
	typeof localStorage === 'undefined' ? { ...defaults } : load()
);

export function saveSound() {
	try {
		localStorage.setItem(KEY, JSON.stringify(sound));
	} catch {
		// Storage can be unavailable (private mode); settings then last for the session.
	}
}

export const isSilent = () => sound.muted || sound.volume === 0;

interface Note {
	freq: number;
	/** Seconds after the cue starts. */
	at: number;
	duration: number;
	/** Slides the pitch to this frequency over the note. */
	to?: number;
	type?: OscillatorType;
	level?: number;
}

// Short synthesized cues: no audio files to load, and they work offline.
const CUES: Record<Cue, Note[]> = {
	correct: [
		{ freq: 659.25, at: 0, duration: 0.14 },
		{ freq: 987.77, at: 0.08, duration: 0.24 }
	],
	almost: [{ freq: 659.25, at: 0, duration: 0.22, level: 0.8 }],
	wrong: [
		{ freq: 220, at: 0, duration: 0.16, to: 196 },
		{ freq: 174.61, at: 0.12, duration: 0.26, to: 155.56 }
	],
	complete: [523.25, 659.25, 783.99, 1046.5].map((freq, i) => ({
		freq,
		at: i * 0.09,
		duration: i === 3 ? 0.45 : 0.16
	}))
};

let context: AudioContext | undefined;

function audio() {
	if (typeof window === 'undefined' || !('AudioContext' in window)) return undefined;
	context ??= new AudioContext();
	// Browsers start audio suspended until the page has had a user gesture.
	if (context.state === 'suspended') void context.resume();
	return context;
}

/** Plays a feedback cue at the current volume, unless sound is muted. */
export function play(cue: Cue) {
	if (isSilent()) return;
	const ctx = audio();
	if (!ctx) return;

	const master = ctx.createGain();
	// Perceived loudness is roughly logarithmic; squaring makes the slider feel linear.
	master.gain.value = sound.volume ** 2 * 0.35;
	master.connect(ctx.destination);

	const start = ctx.currentTime + 0.01;
	for (const note of CUES[cue]) {
		const t = start + note.at;
		const osc = ctx.createOscillator();
		const env = ctx.createGain();
		osc.type = note.type ?? 'triangle';
		osc.frequency.setValueAtTime(note.freq, t);
		if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, t + note.duration);
		// Quick attack and exponential decay, like a struck bell; avoids clicks.
		env.gain.setValueAtTime(0.0001, t);
		env.gain.linearRampToValueAtTime(note.level ?? 1, t + 0.012);
		env.gain.exponentialRampToValueAtTime(0.0001, t + note.duration);
		osc.connect(env).connect(master);
		osc.start(t);
		osc.stop(t + note.duration + 0.05);
	}
}
