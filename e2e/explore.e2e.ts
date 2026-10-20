import { expect, test } from '@playwright/test';
import { createSet, logOut, signUp } from './helpers';

test('explore public sets by search, language and level', async ({ page }) => {
	await signUp(page, 'Clara');
	const stamp = Date.now();
	const title = `Tiere ${stamp}`;
	await createSet(page, {
		title,
		lang: 'de',
		level: 'B2',
		visibility: 'public',
		cards: [
			['der Hund', 'the dog'],
			['die Katze', 'the cat']
		]
	});

	await page.goto('/explore');
	await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
	await expect(page).toHaveURL(/lang=de/);
	const card = page.getByRole('article').filter({ hasText: title });
	await expect(card).toBeVisible();
	await expect(card).toContainText('German');
	await expect(card).toContainText('B2');

	// The level filter combines with the language filter.
	await page.getByRole('combobox', { name: 'Level' }).selectOption('B2');
	await expect(page).toHaveURL(/lang=de.*level=B2/);
	await expect(card).toBeVisible();

	// Search matches titles; "Clear filters" resets everything.
	await page.getByRole('searchbox', { name: 'Search sets' }).fill(String(stamp));
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(new RegExp(`q=${stamp}`));
	await expect(page.getByText('1 set in German at B2')).toBeVisible();
	await page.getByRole('link', { name: 'Clear filters' }).click();
	await expect(page).toHaveURL(/\/explore$/);

	// Another language or level doesn't list it.
	await page.goto('/explore?lang=es');
	await expect(page.getByText('No public sets in Spanish.')).toBeVisible();
	await page.goto('/explore?lang=de&level=A1');
	await expect(page.getByText('No public sets in German at A1.')).toBeVisible();
});

test('public profile lists only public sets', async ({ page }) => {
	await signUp(page, 'Dario');
	const stamp = Date.now();
	await createSet(page, {
		title: `Pubblico ${stamp}`,
		lang: 'it',
		visibility: 'public',
		cards: [['ciao', 'hello']]
	});
	await createSet(page, { title: `Segreto ${stamp}`, lang: 'it', cards: [['grazie', 'thanks']] });

	// Your own profile explains what others see.
	await page.goto('/');
	await page.getByRole('link', { name: 'Public profile' }).click();
	await expect(page.getByText('This is how others see your profile.')).toBeVisible();

	// Another user finds the set in Explore and follows the author link.
	await logOut(page);
	await signUp(page, 'Elena');
	await page.goto(`/explore?q=${stamp}`);
	await page
		.getByRole('article')
		.filter({ hasText: `Pubblico ${stamp}` })
		.getByRole('link', { name: 'Dario' })
		.click();
	await expect(page.getByRole('heading', { name: 'Dario' })).toBeVisible();
	await expect(page.getByText('1 public set · 1 card')).toBeVisible();
	await expect(page.getByRole('link', { name: `Pubblico ${stamp}` })).toBeVisible();
	await expect(page.getByText(`Segreto ${stamp}`)).toHaveCount(0);
	await expect(page.getByText(/@example\.com/)).toHaveCount(0);

	// The card title still opens the set, whose author name links back.
	await page.getByRole('link', { name: `Pubblico ${stamp}` }).click();
	await expect(page.getByRole('heading', { name: `Pubblico ${stamp}` })).toBeVisible();
	await page.getByRole('link', { name: 'Dario' }).click();
	await expect(page.getByRole('heading', { name: 'Dario' })).toBeVisible();
});

test('unknown sets and profiles are 404s', async ({ page }) => {
	expect((await page.goto('/sets/does-not-exist'))?.status()).toBe(404);
	expect((await page.goto('/users/does-not-exist'))?.status()).toBe(404);
	await expect(page.getByText('404')).toBeVisible();
});
