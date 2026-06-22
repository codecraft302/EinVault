import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function explicitMessageKeys(fileName: string) {
	const source = readFileSync(join(here, fileName), 'utf8');
	return new Set([...source.matchAll(/'([^']+)':/g)].map((match) => match[1]));
}

describe('Ukrainian locale coverage', () => {
	it('explicitly overrides every English UI message instead of falling back to English', () => {
		const englishKeys = explicitMessageKeys('en.ts');
		const ukrainianKeys = explicitMessageKeys('uk.ts');
		const missing = [...englishKeys].filter((key) => !ukrainianKeys.has(key));

		expect(missing).toEqual([]);
	});
});
