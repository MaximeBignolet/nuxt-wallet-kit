import { addPlugin, addTemplate, addTypeTemplate, createResolver, defineNuxtModule } from '@nuxt/kit';
import * as viemChains from 'viem/chains';
import type { Chain } from 'viem';

type ViemChains = typeof viemChains;

export type ChainName = {
	[K in keyof ViemChains]: ViemChains[K] extends Chain ? K : never
}[keyof ViemChains];

export interface ModuleOptions {
	chains: ChainName[];
	rpcUrls: Partial<Record<ChainName, string>>;
}

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

		const userRuntimeConfig: Partial<{ rpcUrls: Record<string, string> }> = nuxt.options.runtimeConfig.public.walletKit ?? {};
		nuxt.options.runtimeConfig.public.walletKit = {
			rpcUrls: {
				...Object.fromEntries(chainNames.map(name => [name, options.rpcUrls[name] ?? ``])),
				...userRuntimeConfig.rpcUrls,
			},
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
		};
	}
}

export {};
`,
		});

		addPlugin(resolver.resolve(`./runtime/plugin`));
	},
});
