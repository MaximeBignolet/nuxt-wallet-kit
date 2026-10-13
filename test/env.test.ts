import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';

describe(`runtime env`, async () => {
	await setup({
		rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
		env: {
			NUXT_PUBLIC_WALLET_KIT_RPC_URLS_SEPOLIA: `https://rpc.from-env.test`,
		},
	});

	it(`overrides an RPC URL from an environment variable`, async () => {
		const html = await $fetch<string>(`/`);
		expect(html).toContain(`sepolia:"https://rpc.from-env.test"`);
	});
});
