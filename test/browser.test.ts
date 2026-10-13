import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, createPage, url } from '@nuxt/test-utils/e2e';
import type { NuxtPage } from '@nuxt/test-utils/e2e';
import { installFakeWallet } from './fakeWallet';
import type { FakeWalletOptions } from './fakeWallet';

const ACCOUNT = `0x1111111111111111111111111111111111111111`;
const SHORT_ACCOUNT = `0x1111…1111`;
const SEPOLIA_ID = 11155111;
const MAINNET_ID = 1;
const TEST_TIMEOUT = 30_000;

const openPage = async (options: Partial<FakeWalletOptions> = {}) => {
	const page = await createPage();
	const consoleErrors: string[] = [];
	page.on(`console`, (message) => {
		if (message.type() === `error`) {
			consoleErrors.push(message.text());
		}
	});
	await page.addInitScript(installFakeWallet, {
		account: ACCOUNT,
		chainId: SEPOLIA_ID,
		rejectConnect: false,
		...options,
	});
	await page.goto(url(`/`), { waitUntil: `hydration` });
	return { page, consoleErrors };
};

const connect = async (page: NuxtPage) => {
	await page.getByRole(`button`, { name: `Connecter un wallet` }).click();
	await page.getByRole(`button`, { name: `Test Wallet` }).click();
};

describe(`browser`, async () => {
	await setup({
		rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
		browser: true,
	});

	it(`connects through the wallet picker`, async () => {
		const { page } = await openPage();
		await connect(page);
		await page.getByRole(`button`, { name: SHORT_ACCOUNT }).waitFor();
		await page.getByRole(`dialog`).waitFor({ state: `hidden` });
		await page.close();
	}, TEST_TIMEOUT);

	it(`keeps the wallet connected after a reload without hydration mismatch`, async () => {
		const { page, consoleErrors } = await openPage();
		await connect(page);
		await page.getByRole(`button`, { name: SHORT_ACCOUNT }).waitFor();

		const response = await page.goto(url(`/`), { waitUntil: `hydration` });
		const html = await response?.text();

		expect(html).toContain(`>${SHORT_ACCOUNT}</span>`);
		await page.getByRole(`button`, { name: SHORT_ACCOUNT }).waitFor();
		expect(consoleErrors.filter(error => error.includes(`Hydration`))).toEqual([]);
		await page.close();
	}, TEST_TIMEOUT);

	it(`shows a readable message when the connection is rejected`, async () => {
		const { page } = await openPage({ rejectConnect: true });
		await connect(page);
		await page.getByText(`The request was rejected in your wallet.`).waitFor();
		await page.close();
	}, TEST_TIMEOUT);

	it(`flags an unsupported chain and switches to a configured one`, async () => {
		const { page } = await openPage({ chainId: MAINNET_ID });
		await connect(page);
		await page.getByRole(`button`, { name: `Wrong network` }).click();
		await page.getByRole(`menuitem`, { name: `Switch network` }).click();
		await page.getByRole(`menuitemcheckbox`, { name: `Sepolia` }).click();
		await page.getByRole(`button`, { name: SHORT_ACCOUNT }).waitFor();
		await page.close();
	}, TEST_TIMEOUT);

	it(`disconnects from the account menu and stays disconnected after a reload`, async () => {
		const { page } = await openPage();
		await connect(page);
		await page.getByRole(`button`, { name: SHORT_ACCOUNT }).click();
		await page.getByRole(`menuitem`, { name: `Disconnect` }).click();
		await page.getByRole(`button`, { name: `Connecter un wallet` }).waitFor();

		await page.goto(url(`/`), { waitUntil: `hydration` });
		await page.getByRole(`button`, { name: `Connecter un wallet` }).waitFor();
		await page.close();
	}, TEST_TIMEOUT);
});
