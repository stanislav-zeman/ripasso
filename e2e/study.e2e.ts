import { expect, test } from '@playwright/test';
import {
	answerCorrectly,
	answersFor,
	answerWrongly,
	createSet,
	currentPrompt,
	e2eDb,
	SPANISH,
	signUp
} from './helpers';

const ANSWERS = answersFor(SPANISH);

test('flashcards: flip, mark known, and finish the deck', async ({ page }) => {
	await signUp(page, 'Pia');
	const url = await createSet(page, { title: 'Animales' });
	await page.goto(`${url}/flashcards`);
	for (let i = 0; i < SPANISH.length; i++) {
		// Wait for the card (study pages render in the browser) before using the shortcut.
		await expect(page.getByText(`${i}/${SPANISH.length}`)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Flip card' })).toBeVisible();
		await page.keyboard.press(' '); // flip
		await page.getByRole('button', { name: i % 2 ? 'Know it' : 'Still learning' }).click();
	}
	await expect(page.getByText(`You went through all ${SPANISH.length} cards`)).toBeVisible();
	await expect(page.getByText('2 known · 2 still learning')).toBeVisible();
	await page.getByRole('button', { name: 'Review 2 still learning' }).click();
	await expect(page.getByText('0/2')).toBeVisible();
});

test('write mode: accents, articles, and a retry round for misses', async ({ page }) => {
	await signUp(page, 'Quentin');
	const cards: [string, string][] = [...SPANISH.slice(0, 3), ['por qué', 'why']];
	const answers = answersFor(cards);
	const url = await createSet(page, { title: 'Escribir', cards });
	await page.goto(`${url}/write`);

	for (let i = 0; i < cards.length; i++) {
		const prompt = await currentPrompt(page);
		if (prompt === 'why') {
			// A missing accent counts as "almost".
			await page.getByLabel('Type the answer').fill('por que');
			await page.getByRole('button', { name: 'Answer' }).click();
			await expect(page.getByText('Almost – watch the accents')).toBeVisible();
			await page.getByRole('button', { name: 'Continue' }).click();
		} else if (prompt === 'the cat') {
			await answerWrongly(page, answers);
		} else {
			// The leading article can be left out.
			await page.getByLabel('Type the answer').fill(answers[prompt].replace(/^(el|la) /, ''));
			await page.getByRole('button', { name: 'Answer' }).click();
			await expect(page.getByText('Correct!')).toBeVisible();
		}
		if (i < cards.length - 1)
			await expect(page.getByText(`${i + 1}/${cards.length}`)).toBeVisible();
	}
	await expect(page.getByText('Round 1 done: 3/4 correct')).toBeVisible();

	await page.getByRole('button', { name: 'Retry 1 missed' }).click();
	expect(await currentPrompt(page)).toBe('the cat');
	await answerCorrectly(page, answers);
	await expect(page.getByText('Round 2 done: 1/1 correct')).toBeVisible();
});

test('test mode: multiple choice with a score and the mistakes', async ({ page }) => {
	await signUp(page, 'Rosa');
	const url = await createSet(page, { title: 'Prueba' });
	await page.goto(`${url}/test`);
	const missed = await currentPrompt(page);
	await answerWrongly(page, ANSWERS);
	for (let i = 1; i < SPANISH.length; i++) await answerCorrectly(page, ANSWERS);
	await expect(page.getByText('75%')).toBeVisible();
	await expect(page.getByText('3 of 4 correct')).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: missed })).toContainText(
		ANSWERS[missed]
	);
});

test('match: pair every term with its definition', async ({ page }) => {
	await signUp(page, 'Sara');
	const url = await createSet(page, { title: 'Parejas' });
	await page.goto(`${url}/match`);
	const tile = (text: string) => page.getByRole('button', { name: text, exact: true });

	// A wrong pair adds a one-second penalty.
	await tile('el gato').click();
	await tile('the dog').click();
	await expect(tile('el gato')).toBeEnabled();

	for (const [term, definition] of SPANISH) {
		await tile(term).click();
		await tile(definition).click();
	}
	await expect(page.getByRole('heading', { name: /seconds$/ })).toBeVisible();
	await expect(page.getByText(/New personal best!.*includes 1\.0s penalty/)).toBeVisible();
});

test('learn a whole set, then review it once it is due', async ({ page }) => {
	const email = await signUp(page, 'Tomas');
	const url = await createSet(page, { title: 'Aprender' });

	// New cards: multiple choice first, then typed.
	await page.goto(`${url}/learn`);
	await expect(page.getByText('Choose the matching answer')).toBeVisible();
	for (let turn = 0; turn < 20; turn++) {
		if (await page.getByText('Session complete').isVisible()) break;
		await answerCorrectly(page, ANSWERS);
	}
	await expect(page.getByText('Session complete')).toBeVisible();
	await expect(page.getByText('4 of 4 right on the first try')).toBeVisible();

	await page.goto(url);
	await expect(page.getByText('not started')).toContainText('0 not started');
	await page.goto(`${url}/learn`);
	await expect(page.getByText('All caught up!')).toBeVisible();
	await page.goto('/review');
	await expect(page.getByText('Nothing to review right now')).toBeVisible();

	// Time passes: make this user's cards due (the UI has no clock to fast-forward).
	const db = e2eDb();
	await db.execute({
		sql: 'update card_progress set due = 0 where user_id = (select id from user where email = ?)',
		args: [email]
	});
	db.close();

	await page.goto('/');
	await expect(page.getByText(/You have 4 cards to review today/)).toBeVisible();
	await page.getByRole('link', { name: 'Start daily review' }).click();
	for (let turn = 0; turn < 10; turn++) {
		if (await page.getByText('Session complete').isVisible()) break;
		// Due cards skip multiple choice and go straight to typing.
		await expect(page.getByLabel('Type the answer')).toBeVisible();
		await answerCorrectly(page, ANSWERS);
	}
	await expect(page.getByText('Session complete')).toBeVisible();
	await page.reload();
	await expect(page.getByText('Nothing to review right now')).toBeVisible();
});
