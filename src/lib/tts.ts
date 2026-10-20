const LOCALES: Record<string, string> = {
	it: 'it-IT',
	en: 'en-US',
	de: 'de-DE',
	fr: 'fr-FR',
	es: 'es-ES'
};

export function canSpeak() {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speaks `text` with the browser's built-in voices, preferring one for `lang`. */
export function speak(text: string, lang = 'it') {
	if (!canSpeak()) return;
	const locale = LOCALES[lang] ?? lang;
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = locale;
	const voice = speechSynthesis
		.getVoices()
		.find((v) => v.lang.replace('_', '-').startsWith(locale.slice(0, 2)));
	if (voice) utterance.voice = voice;
	utterance.rate = 0.9;
	speechSynthesis.cancel();
	speechSynthesis.speak(utterance);
}
