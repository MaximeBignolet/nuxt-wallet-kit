import { addComponentsDir, addImports, addPlugin, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, hasNuxtModule, useLogger } from '@nuxt/kit';
import * as viemChains from 'viem/chains';
import type { Chain } from 'viem';

type ViemChains = typeof viemChains;

export type ChainName = {
	[K in keyof ViemChains]: ViemChains[K] extends Chain ? K : never
}[keyof ViemChains];

export interface WalletKitLabels {
	connect: string;
	modalTitle: string;
	modalDescription: string;
	noWallet: string;
	installWallet: string;
	rejected: string;
	connectError: string;
	copyAddress: string;
	copied: string;
	copyError: string;
	viewOnExplorer: string;
	switchNetwork: string;
	switchError: string;
	wrongNetwork: string;
	disconnect: string;
}

export interface ModuleOptions {
	chains: ChainName[];
	rpcUrls: Partial<Record<ChainName, string>>;
	labels: Partial<WalletKitLabels>;
}

const DEFAULT_LABELS: WalletKitLabels = {
	connect: `Connect wallet`,
	modalTitle: `Connect a wallet`,
	modalDescription: `Choose a wallet installed in your browser.`,
	noWallet: `No wallet detected in this browser.`,
	installWallet: `How to get a wallet`,
	rejected: `The request was rejected in your wallet.`,
	connectError: `Could not connect. Please try again.`,
	copyAddress: `Copy address`,
	copied: `Address copied`,
	copyError: `Could not copy the address.`,
	viewOnExplorer: `View on explorer`,
	switchNetwork: `Switch network`,
	switchError: `Could not switch network.`,
	wrongNetwork: `Wrong network`,
	disconnect: `Disconnect`,
};

const isChainName = (name: string): name is ChainName => {
	const candidate = viemChains[name as keyof ViemChains];
	return typeof candidate === `object` && candidate !== null && `id` in candidate;
};

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: `nuxt-wallet-kit`,
		configKey: `walletKit`,
		compatibility: {
			nuxt: `^3.19.0 || >=4.1.0`,
		},
	},
	moduleDependencies: {
		'@wagmi/vue/nuxt': {},
	},
	defaults: {
		chains: [],
		rpcUrls: {},
		labels: DEFAULT_LABELS,
	},
	setup(options, nuxt) {
		const resolver = createResolver(import.meta.url);

		const unknownChains = options.chains.filter(name => !isChainName(name));
		if (unknownChains.length > 0) {
			throw new Error(`[nuxt-wallet-kit] Unknown chain(s): ${unknownChains.join(`, `)}. Use export names from 'viem/chains'.`);
		}
		const chainNames: ChainName[] = options.chains.length > 0
			? [...new Set(options.chains)]
			: [`mainnet`];

		const userRuntimeConfig: Partial<{ rpcUrls: Record<string, string>; labels: Partial<WalletKitLabels> }> = nuxt.options.runtimeConfig.public.walletKit ?? {};
		nuxt.options.runtimeConfig.public.walletKit = {
			rpcUrls: {
				...Object.fromEntries(chainNames.map(name => [name, options.rpcUrls[name] ?? ``])),
				...userRuntimeConfig.rpcUrls,
			},
			labels: { ...DEFAULT_LABELS, ...options.labels, ...userRuntimeConfig.labels },
		};

		const chainsTemplate = addTemplate({
			filename: `wallet-kit/chains.mjs`,
			getContents: () => [
				`import { ${chainNames.join(`, `)} } from 'viem/chains';`,
				`export const chainsByName = { ${chainNames.join(`, `)} };`,
				`export const chains = [${chainNames.join(`, `)}];`,
			].join(`\n`),
		});
		nuxt.options.alias[`#wallet-kit/chains`] = chainsTemplate.dst;

		addTemplate({
			filename: `wallet-kit/chains.d.mts`,
			write: true,
			getContents: () => [
				`import type { Chain } from 'viem';`,
				`export declare const chainsByName: Record<string, Chain>;`,
				`export declare const chains: readonly [Chain, ...Chain[]];`,
			].join(`\n`),
		});

		addTypeTemplate({
			filename: `types/wallet-kit.d.ts`,
			getContents: () => `declare module 'nuxt/schema' {
	interface PublicRuntimeConfig {
		walletKit: {
			rpcUrls: Record<string, string>;
			labels: Record<${Object.keys(DEFAULT_LABELS).map(key => `'${key}'`).join(` | `)}, string>;
		};
	}
}

export {};
`,
		});

		addPlugin(resolver.resolve(`./runtime/plugin`));
		addImports({ name: `useWallet`, from: resolver.resolve(`./runtime/composables/useWallet`) });

		if (!hasNuxtModule(`@nuxt/ui`)) {
			useLogger(`nuxt-wallet-kit`).warn(`@nuxt/ui is not installed: wallet components are disabled, \`useWallet()\` is still available.`);
			return;
		}
		addImports({ name: `useWalletModal`, from: resolver.resolve(`./runtime/composables/useWalletModal`) });
		addComponentsDir({ path: resolver.resolve(`./runtime/components`) });
	},
});
