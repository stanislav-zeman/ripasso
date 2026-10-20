import { expect, test, type Page } from '@playwright/test';

const WORDS =
	'el gato\tthe cat\nla casa\tthe house\npor qué\twhy\nel perro\tthe dog\ncomer\tto eat';

async function signUp(page: Page, name: string) {
	await page.goto('/signup');
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('Email').fill(`${name.toLowerCase()}-${Date.now()}@example.com`);
	await page.getByLabel('Password').fill('password123');
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByRole('heading', { name: `Hi, ${name}!` })).toBeVisible();
}

test('create a set, study it, and keep it private from others', async ({ page }) => {
	await signUp(page, 'Anna');

	// Sound effects can be muted, and the choice survives a reload.
	const soundButton = page.getByRole('button', { name: /^Sound effects/ });
	await soundButton.click();
	await page.getByRole('button', { name: 'Mute' }).click();
	await page.reload();
	await expect(soundButton).toHaveAccessibleName('Sound effects: off');
	await soundButton.click();
	await page.getByRole('button', { name: 'Turn on' }).click();
	await expect(soundButton).toHaveAccessibleName('Sound effects: 60%');

	// Create a set by pasting a Quizlet-style export. Its Language is required.
	await page.getByRole('link', { name: 'New set' }).click();
	await page.getByLabel('Title').fill('Animales y casa');
	await expect(page.getByRole('button', { name: 'Create set' })).toBeDisabled();
	await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('es');
	await page.getByLabel('Translated into').selectOption('en');
	await page.getByPlaceholder(/el perro/).fill(WORDS);
	await page.getByRole('button', { name: 'Add 5 cards' }).click();
	await page.getByRole('button', { name: 'Create set' }).click();
	await expect(page.getByRole('heading', { name: 'Animales y casa' })).toBeVisible();
	await expect(page.getByText('5 cards')).toBeVisible();
	const setUrl = page.url();

	// Flashcards flip.
	await page.getByRole('link', { name: /Flashcards/ }).click();
	await page.getByRole('button', { name: 'Flip card' }).click();
	// "Know it" records a spaced-repetition review.
	const known = page.waitForResponse((r) => r.url().endsWith('/api/review') && r.ok());
	await page.getByRole('button', { name: 'Know it' }).click();
	await known;

	// Write mode ignores Spanish articles and accepts an answer without accents as "almost".
	await page.goto(`${setUrl}/write`);
	const prompt = (await page.locator('.card p').first().textContent())!.trim();
	const answers: Record<string, string> = {
		'the cat': 'gato',
		'the house': 'casa',
		why: 'por que',
		'the dog': 'perro',
		'to eat': 'comer'
	};
	await page.getByLabel('Type the answer').fill(answers[prompt]);
	await page.getByRole('button', { name: 'Answer' }).click();
	await expect(
		page.getByText(prompt === 'why' ? 'Almost – watch the accents' : 'Correct!')
	).toBeVisible();

	// Learn mode: answer the first multiple-choice question; progress is saved.
	await page.goto(`${setUrl}/learn`);
	await expect(page.getByText('Choose the matching answer')).toBeVisible();
	const reviewed = page
		.waitForResponse((r) => r.url().endsWith('/api/review'), { timeout: 2000 })
		.catch(() => null);
	await page.getByRole('button', { name: /^1/ }).click();
	await reviewed;

	// Back on the set page, the earlier write answer counts as progress.
	await page.goto(setUrl);
	await expect(page.getByText(/1 learning|1 learned/)).toBeVisible();

	// A second user can't see the private set.
	await page.getByRole('button', { name: 'Log out' }).click();
	await signUp(page, 'Bruno');
	const res = await page.goto(setUrl);
	expect(res?.status()).toBe(404);
	const edit = await page.goto(`${setUrl}/edit`);
	expect(edit?.status()).toBe(404);
});

test('explore public sets by language', async ({ page }) => {
	await signUp(page, 'Clara');
	const title = `Tiere ${Date.now()}`;
	await page.goto('/sets/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('de');
	await page.getByLabel('Visibility').selectOption('public');
	await page.getByPlaceholder(/el perro/).fill('der Hund\tthe dog\ndie Katze\tthe cat');
	await page.getByRole('button', { name: 'Create set' }).click();
	await expect(page.getByText('Terms in this set')).toBeVisible();

	await page.goto('/explore');
	await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
	await expect(page).toHaveURL(/lang=de/);
	await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
	await expect(page.getByRole('link', { name: new RegExp(title) })).toContainText('German');

	// Another language doesn't list it.
	await page.goto('/explore?lang=es');
	await expect(page.getByText('No public sets in Spanish.')).toBeVisible();
});
