// Same values as ts-fsrs `Rating`; duplicated so the scheduler isn't bundled into the client.
export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const;
export type Grade = (typeof Rating)[keyof typeof Rating];

async function post(url: string, body: unknown) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`${url} failed with ${res.status}`);
	return res.json();
}

/** Records an answer for spaced repetition. Failures are logged, not shown: studying goes on. */
export function recordReview(cardId: string, rating: Grade) {
	return post('/api/review', { cardId, rating }).catch((e) => console.error(e));
}

export function saveStar(cardId: string, starred: boolean) {
	return post('/api/star', { cardId, starred });
}
