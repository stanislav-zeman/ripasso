import { expect, test } from '@playwright/test';
import { logIn, logOut, PASSWORD, signUp, uniqueEmail } from './helpers';

test('landing page for visitors', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Learn words that stick.' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open source on GitHub' })).toHaveAttribute(
		'href',
		'https://github.com/stanislav-zeman/ripasso'
	);
	await page.getByRole('link', { name: 'Get started' }).click();
	await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
});

test('protected pages send you to log in, then back where you were going', async ({ page }) => {
	await page.goto('/sets/new');
	await expect(page).toHaveURL(/\/login\?next=%2Fsets%2Fnew/);

	// Switching to sign-up keeps the destination.
	await page.getByRole('link', { name: 'Create an account' }).click();
	await expect(page).toHaveURL(/\/signup\?next=%2Fsets%2Fnew/);
	await page.getByLabel('Name').fill('Fabio');
	await page.getByLabel('Email').fill(uniqueEmail('fabio'));
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByRole('heading', { name: 'Create a new set' })).toBeVisible();

	// Logged-in users skip the login page.
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Hi, Fabio!' })).toBeVisible();
});

test('typing before the page has finished loading is kept', async ({ page }) => {
	// Slow connection: the page's JavaScript arrives a second after the HTML.
	await page.route('**/_app/immutable/**', async (route) => {
		await new Promise((r) => setTimeout(r, 1000));
		await route.continue();
	});
	await page.goto('/signup', { waitUntil: 'commit' });
	await page.getByLabel('Name').fill('Early Bird');
	await page.getByLabel('Email').fill('early@example.com');
	await page.waitForLoadState('networkidle'); // JavaScript loaded and the page hydrated
	await expect(page.getByLabel('Name')).toHaveValue('Early Bird');
	await expect(page.getByLabel('Email')).toHaveValue('early@example.com');
});

test('log out, failed log in, and log back in', async ({ page }) => {
	const email = await signUp(page, 'Gina');
	await logOut(page);

	await logIn(page, email, 'wrong-password');
	await expect(page.getByRole('alert')).toBeVisible();
	await expect(page).toHaveURL(/\/login/);

	await logIn(page, email);
	await expect(page.getByRole('heading', { name: 'Hi, Gina!' })).toBeVisible();

	// The same email can't sign up twice.
	await logOut(page);
	await page.goto('/signup');
	await page.getByLabel('Name').fill('Gina Again');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByRole('alert')).toBeVisible();
});

test('mobile navigation', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await signUp(page, 'Hana');
	// On phones the section links move to a bar under the header.
	await page.getByRole('link', { name: 'Explore', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Explore public sets' })).toBeVisible();
	await page.getByRole('link', { name: 'Review', exact: true }).click();
	await expect(page.getByText('Nothing to review right now')).toBeVisible();
	await page.getByRole('link', { name: 'New set' }).click();
	await expect(page.getByRole('heading', { name: 'Create a new set' })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('sound effects can be muted, and the choice is remembered', async ({ page }) => {
	await page.goto('/');
	const soundButton = page.getByRole('button', { name: /^Sound effects/ });
	await soundButton.click();
	await page.getByRole('button', { name: 'Mute' }).click();
	await page.reload();
	await expect(soundButton).toHaveAccessibleName('Sound effects: off');
	await soundButton.click();
	await page.getByRole('button', { name: 'Turn on' }).click();
	await expect(soundButton).toHaveAccessibleName('Sound effects: 60%');
});
