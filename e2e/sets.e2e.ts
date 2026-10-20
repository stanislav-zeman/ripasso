import { expect, test } from '@playwright/test';
import { createSet, logOut, SPANISH, signUp } from './helpers';

test('the editor needs a language and imports pasted lists', async ({ page }) => {
	await signUp(page, 'Ivo');
	await page.goto('/sets/new');
	await page.getByLabel('Title').fill('Draft');
	await page.getByPlaceholder(/el perro/).fill('uno - one\ndos - two\nnot a card');
	await expect(page.getByText('2 cards found, 1 line skipped')).toBeVisible();

	// Without the set's language it can't be saved.
	await expect(page.getByText("Choose the set's language to save")).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create set' })).toBeDisabled();

	await page.getByRole('button', { name: 'Add 2 cards' }).click();
	await expect(page.getByRole('heading', { name: 'Cards (2)' })).toBeVisible();
	await page.getByRole('button', { name: '+ Add card' }).click();
	await page.getByLabel('Term 3').fill('tres');
	await page.getByLabel('Definition 3').fill('three');
	await page.getByRole('button', { name: 'Delete card 1' }).click();
	await expect(page.getByRole('heading', { name: 'Cards (2)' })).toBeVisible();

	await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('es');
	await page.getByRole('button', { name: 'Create set' }).click();
	await expect(page.getByRole('heading', { name: 'Draft' })).toBeVisible();
	await expect(page.getByText('2 cards')).toBeVisible();
	await expect(page.getByText('tres')).toBeVisible();
	await expect(page.getByText('uno', { exact: true })).toHaveCount(0);
});

test('editing a set keeps study progress; starring and starred-only study', async ({ page }) => {
	await signUp(page, 'Jana');
	const url = await createSet(page, { title: 'Animales' });

	// Study one card so there is progress to keep.
	await page.goto(`${url}/flashcards`);
	await page.getByRole('button', { name: 'Flip card' }).click();
	const reviewed = page.waitForResponse((r) => r.url().endsWith('/api/review') && r.ok());
	await page.getByRole('button', { name: 'Know it' }).click();
	await reviewed;
	await page.goto(url);
	await expect(page.getByText('not started')).toContainText('1 learning');

	// Rename, reword a card and add one.
	await page.getByRole('link', { name: 'Edit' }).click();
	await page.getByLabel('Title').fill('Animales y comida');
	await page.getByLabel('Definition 4').fill('to eat / to have a meal');
	await page.getByRole('button', { name: '+ Add card' }).click();
	await page.getByLabel('Term 5').fill('beber');
	await page.getByLabel('Definition 5').fill('to drink');
	await page.getByRole('button', { name: 'Save changes' }).click();

	await expect(page.getByRole('heading', { name: 'Animales y comida' })).toBeVisible();
	await expect(page.getByText('5 cards')).toBeVisible();
	await expect(page.getByText('to eat / to have a meal')).toBeVisible();
	// Edited cards keep their id, so the progress is still there.
	await expect(page.getByText('not started')).toContainText('1 learning');

	// Stars are saved per user.
	await page.getByRole('button', { name: 'Star card' }).first().click();
	await expect(page.getByRole('button', { name: 'Unstar card' })).toHaveCount(1);
	await page.reload();
	await expect(page.getByRole('button', { name: 'Unstar card' })).toHaveCount(1);

	// Flashcards can be limited to starred cards.
	await page.goto(`${url}/flashcards`);
	await expect(page.getByText('0/5')).toBeVisible();
	await page.getByText('Options').click();
	await page.getByLabel(/Starred only/).check();
	await expect(page.getByText('0/1')).toBeVisible();
});

test('unlisted sets open by link but are not listed; others can copy them', async ({ page }) => {
	await signUp(page, 'Karl');
	const title = `Unlisted ${Date.now()}`;
	const url = await createSet(page, { title, visibility: 'unlisted' });
	await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
	await logOut(page);

	await signUp(page, 'Lena');
	await page.goto(url);
	await expect(page.getByRole('heading', { name: title })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
	await page.goto(`/explore?q=${encodeURIComponent(title)}`);
	await expect(page.getByText(/No public sets/)).toBeVisible();

	// Copying makes a private set Lena owns, and opens it in the editor.
	await page.goto(url);
	await page.getByRole('button', { name: 'Copy to my library' }).click();
	await expect(page.getByRole('heading', { name: 'Edit set' })).toBeVisible();
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByRole('heading', { name: title })).toBeVisible();
	await expect(page.getByText('private', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
	await page.goto('/');
	await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible();
});

test('deleting a set', async ({ page }) => {
	await signUp(page, 'Marta');
	const title = `Temporary ${Date.now()}`;
	const url = await createSet(page, { title, cards: SPANISH.slice(0, 2) });
	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByRole('heading', { name: 'Hi, Marta!' })).toBeVisible();
	await expect(page.getByText(title)).toHaveCount(0);
	expect((await page.goto(url))?.status()).toBe(404);
});

test('private sets are hidden from other users', async ({ page }) => {
	await signUp(page, 'Nora');
	const url = await createSet(page, { title: 'Secret' });
	await logOut(page);
	// Logged out, and as another user, the set doesn't exist.
	expect((await page.goto(url))?.status()).toBe(404);
	await signUp(page, 'Otto');
	expect((await page.goto(url))?.status()).toBe(404);
	expect((await page.goto(`${url}/edit`))?.status()).toBe(404);

	// Study pages render in the browser: the shell loads, but the set's data is refused.
	const data = page.waitForResponse((r) => r.url().includes('__data.json'));
	await page.goto(`${url}/flashcards`);
	// SvelteKit's data request answers 200 and carries the error inside: the set's node is a 404.
	// Re-request it: the page has moved on to the error page, so the original body is gone.
	const body = await (await page.request.get((await data).url())).text();
	expect(body).toContain('{"type":"error","error":{"status":404,"message":"Set not found"}}');
	expect(body).not.toContain('Secret');
	await expect(page.getByText('Set not found')).toBeVisible();
	await expect(page.getByText('Secret')).toHaveCount(0);
});
