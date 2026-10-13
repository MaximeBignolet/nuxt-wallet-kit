export default defineNuxtConfig({
	modules: [`@nuxt/ui`, `nuxt-wallet-kit`],
	devtools: { enabled: true },
	css: [`~/assets/css/main.css`],
	compatibilityDate: `latest`,
	walletKit: {
		chains: [`sepolia`, `baseSepolia`],
	},
});
