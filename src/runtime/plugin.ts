import { defineNuxtPlugin, useRequestHeaders, useRuntimeConfig } from '#app';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { hydrate } from '@wagmi/core';
import { configKey, createConfig, createStorage, http, injected } from '@wagmi/vue';
import type { Transport } from 'viem';
import { chains, chainsByName } from '#wallet-kit/chains';
import { readWalletState, walletCookieStorage } from './utils/walletCookie';

export default defineNuxtPlugin({
	name: `wallet-kit`,
	setup(nuxtApp) {
		const { rpcUrls } = useRuntimeConfig().public.walletKit;
		const cookie = import.meta.server
			? useRequestHeaders([`cookie`]).cookie
			: document.cookie;

		const transports: Record<number, Transport> = Object.fromEntries(
			Object.entries(chainsByName).map(([name, chain]) => [chain.id, http(rpcUrls[name] || undefined)]),
		);

		const config = createConfig({
			chains,
			connectors: [injected()],
			ssr: true,
			storage: createStorage({ storage: walletCookieStorage }),
			transports,
		});

		const { onMount } = hydrate(config, {
			initialState: readWalletState(config, cookie),
			reconnectOnMount: true,
		});

		nuxtApp.vueApp.use(VueQueryPlugin, { queryClient: new QueryClient() });
		nuxtApp.vueApp.provide(configKey, config);
		nuxtApp.hook(`app:mounted`, () => onMount());
	},
});
