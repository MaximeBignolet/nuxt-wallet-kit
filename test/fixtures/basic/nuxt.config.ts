import WalletKit from '../../../src/module';

export default defineNuxtConfig({
	modules: [
		`@nuxt/ui`,
		WalletKit,
	],
	runtimeConfig: {
		public: {
			walletKit: {
				rpcUrls: {
					sepolia: `https://rpc.example.test`,
				},
			},
		},
	},
	walletKit: {
		chains: [`sepolia`],
		labels: {
			connect: `Connecter un wallet`,
		},
	},
});
