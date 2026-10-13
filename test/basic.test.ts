import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { serialize } from '@wagmi/core';

const ADDRESS = `0x1111111111111111111111111111111111111111`;
const SEPOLIA_ID = 11155111;

const walletCookie = () => {
	const uid = `test-uid`;
	const state = {
		connections: new Map([[uid, {
			accounts: [ADDRESS],
			chainId: SEPOLIA_ID,
			connector: { id: `injected`, name: `Injected`, type: `injected`, uid },
		}]]),
		chainId: SEPOLIA_ID,
		current: uid,
	};
	return `wagmi.store=${serialize({ state, version: 3 })}`;
};

describe(`ssr`, async () => {
	await setup({
		rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
	});

	it(`registers only the configured chains`, async () => {
		const html = await $fetch<string>(`/`);
		expect(html).toContain(`<p data-testid="chains">Sepolia</p>`);
	});

	it(`renders a disconnected wallet without cookie`, async () => {
		const html = await $fetch<string>(`/`);
		expect(html).toContain(`<p data-testid="status">disconnected</p>`);
		expect(html).not.toContain(ADDRESS);
	});

	it(`renders the connected address from the wallet cookie`, async () => {
		const html = await $fetch<string>(`/`, { headers: { cookie: walletCookie() } });
		expect(html).toContain(`<p data-testid="status">reconnecting</p>`);
		expect(html).toContain(`<p data-testid="address">${ADDRESS}</p>`);
	});

	it(`renders the connect button with overridden labels`, async () => {
		const html = await $fetch<string>(`/`);
		expect(html).toContain(`>Connecter un wallet</span>`);
	});

	it(`renders the short address in the wallet button from the cookie`, async () => {
		const html = await $fetch<string>(`/`, { headers: { cookie: walletCookie() } });
		expect(html).toContain(`>0x1111…1111</span>`);
		expect(html).not.toContain(`>Connecter un wallet</span>`);
	});

	it(`keeps runtime config values set by the app`, async () => {
		const html = await $fetch<string>(`/`);
		expect(html).toContain(`sepolia:"https://rpc.example.test"`);
	});

	it(`ignores a malformed wallet cookie`, async () => {
		const html = await $fetch<string>(`/`, { headers: { cookie: `wagmi.store={broken` } });
		expect(html).toContain(`<p data-testid="status">disconnected</p>`);
	});
});
