import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));

const assetExtensions = {
	cmaps: ['.bcmap'],
	// pdfjs-dist ships both LiberationSans TTF files and Foxit PFB standard-font
	// fallbacks. Serve both so PDFs using Courier/Times/Symbol/ZapfDingbats do
	// not render blank boxes or fail after the main document loads.
	standard_fonts: ['.ttf', '.pfb'],
	wasm: ['.wasm'],
	iccs: ['.icc']
} as const;

type AssetKind = keyof typeof assetExtensions;

const contentTypes: Record<string, string> = {
	'.bcmap': 'application/octet-stream',
	'.ttf': 'font/ttf',
	'.pfb': 'application/octet-stream',
	'.wasm': 'application/wasm',
	'.icc': 'application/vnd.iccprofile'
};

function isAssetKind(kind: string): kind is AssetKind {
	return Object.hasOwn(assetExtensions, kind);
}

function assetExtension(kind: AssetKind, file: string): string | null {
	return assetExtensions[kind].find((ext) => file.endsWith(ext)) ?? null;
}

export const GET: RequestHandler = async ({ params }) => {
	const { kind, file } = params;

	if (!isAssetKind(kind)) {
		error(404, 'Not found');
	}
	if (!/^[A-Za-z0-9_.-]+$/.test(file)) {
		error(404, 'Not found');
	}

	const ext = assetExtension(kind, file);
	if (!ext) {
		error(404, 'Not found');
	}

	try {
		const bytes = await readFile(join(pdfjsRoot, kind, file));

		return new Response(bytes, {
			headers: {
				'Content-Type': contentTypes[ext],
				'Cache-Control': 'public, max-age=31536000, immutable',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch {
		error(404, 'Not found');
	}
};
