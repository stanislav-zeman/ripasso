import { createClient } from '@libsql/client';
import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'password123';

// Random, not time-based: parallel workers sign up in the same millisecond.
export const uniqueEmail = (name: string) =>
	`${name.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}@example.com`;

/** Signs up a fresh account and waits for the library. Returns its email. */
export async function signUp(page: Page, name: string, email = uniqueEmail(name)) {
	await page.goto('/signup');
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByRole('heading', { name: `Hi, ${name}!` })).toBeVisible();
	return email;
}

export async function logIn(page: Page, email: string, password = PASSWORD) {
	await page.goto('/login');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
}

export async function logOut(page: Page) {
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page.getByRole('heading', { name: 'Learn words that stick.' })).toBeVisible();
}

/** Spanish sample cards: [term, definition]. Definitions are what study modes show by default. */
export const SPANISH: [string, string][] = [
	['el gato', 'the cat'],
	['la casa', 'the house'],
	['el perro', 'the dog'],
	['comer', 'to eat']
];

interface NewSet {
	title: string;
	cards?: [string, string][];
	lang?: string;
	level?: string;
	visibility?: 'private' | 'unlisted' | 'public';
}

/** Creates a set through the editor's import box and returns the set page URL. */
export async function createSet(page: Page, set: NewSet) {
	await page.goto('/sets/new');
	await page.getByLabel('Title').fill(set.title);
	await page
		.getByRole('combobox', { name: 'Language', exact: true })
		.selectOption(set.lang ?? 'es');
	if (set.level)
		await page.getByRole('combobox', { name: 'Level (optional)' }).selectOption(set.level);
	await page.getByLabel('Visibility').selectOption(set.visibility ?? 'private');
	const cards = set.cards ?? SPANISH;
	await page.getByPlaceholder(/el perro/).fill(cards.map((c) => c.join('\t')).join('\n'));
	await page.getByRole('button', { name: 'Create set' }).click();
	await expect(page.getByRole('heading', { name: set.title })).toBeVisible();
	return page.url();
}

/** The prompt shown by the current Write / multiple-choice question. */
export async function currentPrompt(page: Page) {
	return (await page.locator('.card p').first().textContent())!.trim();
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The multiple-choice option button showing exactly `text` (options are numbered 1–4). */
export const option = (page: Page, text: string) =>
	page.getByRole('button', { name: new RegExp(`^\\d\\s*${escape(text)}$`) });

/**
 * Answers the current Learn/Write/Test question correctly, whatever its type, using
 * `answers` (prompt → answer). Moves past any feedback box.
 */
export async function answerCorrectly(page: Page, answers: Record<string, string>) {
	return answer(page, answers, true);
}

/** Like `answerCorrectly`, but gives a wrong answer (and continues past the feedback). */
export async function answerWrongly(page: Page, answers: Record<string, string>) {
	return answer(page, answers, false);
}

async function answer(page: Page, answers: Record<string, string>, correct: boolean) {
	const promptEl = await page.locator('.card p').first().elementHandle();
	const prompt = await currentPrompt(page);
	const expected = answers[prompt];
	expect(expected, `no answer known for prompt "${prompt}"`).toBeTruthy();
	if (await page.getByText('Choose the matching answer').isVisible()) {
		if (correct) await option(page, expected).click();
		else
			await page
				.getByRole('button', { name: /^\d/ })
				.filter({ hasNotText: expected })
				.first()
				.click();
	} else {
		await page.getByLabel('Type the answer').fill(correct ? expected : 'sbagliato');
		await page.getByRole('button', { name: 'Answer' }).click();
		if (!correct) await page.getByRole('button', { name: 'Continue' }).click();
	}
	// Each question is a fresh component, so the old prompt leaves the page once it moves on
	// (even when the next question shows the same card, as Learn does after multiple choice).
	await page.waitForFunction((el) => !el?.isConnected, promptEl, { timeout: 5000 });
}

/** prompt → answer map for the default direction (shown: definition, answered: term). */
export const answersFor = (cards: [string, string][]) =>
	Object.fromEntries(cards.map(([term, definition]) => [definition, term]));

/** Direct access to the throwaway E2E database, for state the UI can't create (e.g. time passing). */
export const e2eDb = () => createClient({ url: 'file:e2e.db' });
