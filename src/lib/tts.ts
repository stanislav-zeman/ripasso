import { LANGUAGES } from './languages';

export function canSpeak() {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speaks `text` with the browser's built-in voices, preferring one for `lang`. */
export function speak(text: string, lang: string) {
	if (!canSpeak()) return;
	const locale = LANGUAGES[lang]?.locale ?? lang;
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = locale;
	const voices = speechSynthesis.getVoices().map((v) => ({ v, lang: v.lang.replace('_', '-') }));
	const voice =
		voices.find((x) => x.lang === locale) ??
		voices.find((x) => x.lang.startsWith(locale.slice(0, 2)));
	if (voice) utterance.voice = voice.v;
	utterance.rate = 0.9;
	speechSynthesis.cancel();
	speechSynthesis.speak(utterance);
}
