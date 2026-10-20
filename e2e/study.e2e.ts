import { expect, test, type Page } from '@playwright/test';

const WORDS =
	'il gatto\tthe cat\nla casa\tthe house\nperché\twhy\nil cane\tthe dog\nmangiare\tto eat';

async function signUp(page: Page, name: string) {
	await page.goto('/signup');
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('Email').fill(`${name.toLowerCase()}-${Date.now()}@example.com`);
	await page.getByLabel('Password').fill('password123');
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByRole('heading', { name: `Ciao, ${name}!` })).toBeVisible();
}

test('create a set, study it, and keep it private from others', async ({ page }) => {
	await signUp(page, 'Anna');

	// Create a set by pasting a Quizlet-style export.
	await page.getByRole('link', { name: '+ New set' }).click();
	await page.getByLabel('Title').fill('Animali e casa');
	await page.getByPlaceholder(/il gatto/).fill(WORDS);
	await page.getByRole('button', { name: 'Add 5 cards' }).click();
	await page.getByRole('button', { name: 'Create set' }).click();
	await expect(page.getByRole('heading', { name: 'Animali e casa' })).toBeVisible();
	await expect(page.getByText('5 cards')).toBeVisible();
	const setUrl = page.url();

	// Flashcards flip.
	await page.getByRole('link', { name: /Flashcards/ }).click();
	await page.getByRole('button', { name: 'Flip card' }).click();
	// "Know it" records a spaced-repetition review.
	const known = page.waitForResponse((r) => r.url().endsWith('/api/review') && r.ok());
	await page.getByRole('button', { name: 'Know it' }).click();
	await known;

	// Write mode accepts an answer without accents as "almost".
	await page.goto(`${setUrl}/write`);
	const prompt = (await page.locator('.card p').first().textContent())!.trim();
	const answers: Record<string, string> = {
		'the cat': 'gatto',
		'the house': 'casa',
		why: 'perche',
		'the dog': 'cane',
		'to eat': 'mangiare'
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
