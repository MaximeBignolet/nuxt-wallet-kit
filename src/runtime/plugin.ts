import { defineNuxtPlugin, useRequestHeaders, useRuntimeConfig } from '#app';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { hydrate } from '@wagmi/core';
import { configKey, cookieStorage, cookieToInitialState, createConfig, createStorage, http, injected } from '@wagmi/vue';
import type { Transport } from 'viem';
import { chains, chainsByName } from '#wallet-kit/chains';

export default defineNuxtPlugin({
	name: `wallet-kit`,
	setup(nuxtApp) {
		const { rpcUrls } = useRuntimeConfig().public.walletKit;

		const transports: Record<number, Transport> = Object.fromEntries(
			Object.entries(chainsByName).map(([name, chain]) => [chain.id, http(rpcUrls[name] || undefined)]),
		);

		const config = createConfig({
			chains,
			connectors: [injected()],
			ssr: true,
			storage: createStorage({ storage: cookieStorage }),
			transports,
		});

		const cookie = import.meta.server
			? useRequestHeaders([`cookie`]).cookie
			: document.cookie;

		const { onMount } = hydrate(config, {
			initialState: cookieToInitialState(config, cookie),
			reconnectOnMount: true,
		});

		nuxtApp.vueApp.use(VueQueryPlugin, { queryClient: new QueryClient() });
		nuxtApp.vueApp.provide(configKey, config);
		nuxtApp.hook(`app:mounted`, () => onMount());
	},
});
