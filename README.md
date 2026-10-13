# nuxt-wallet-kit

[![Nuxt][nuxt-src]][nuxt-href]

Zero-config [wagmi](https://wagmi.sh) for Nuxt: SSR-safe wallet state and ready-to-use [Nuxt UI](https://ui.nuxt.com) wallet components.

> Status: early version, not published on npm yet.

## Why

The official `@wagmi/vue/nuxt` module only auto-imports the wagmi composables. You still have to write the plugin, the config, the transports, and handle server rendering yourself. Without that last part, a connected user reloading the page sees "Connect wallet" flash before their address appears, or gets a hydration mismatch.

`nuxt-wallet-kit` does all of that from `nuxt.config`, and adds the UI.

## Features

- Configure chains and RPC URLs from `nuxt.config`, with autocompletion of chain names.
- Only the chains you list are bundled, not the whole `viem/chains` catalog.
- The connected address is rendered on the server from a cookie: no flash, no hydration mismatch.
- One wagmi config per request on the server: no wallet state shared between visitors.
- `useWallet()`: a small API over wagmi (address, ENS name, chain, connect, switch chain…).
- `<WalletButton />`: connect button, wallet picker modal and account menu built with Nuxt UI.
- Every UI string can be translated.
- All wagmi composables (`useBalance`, `useReadContract`, `useWriteContract`…) stay auto-imported.

## Requirements

- Nuxt `^3.19.0` or `>=4.1.0`
- `@nuxt/ui` v4 for the components (optional: without it, only the composables are registered)
- Your app wrapped in `<UApp>`, which hosts the modal and the toasts

## Setup

```bash
npm install nuxt-wallet-kit
```

```ts
export default defineNuxtConfig({
	modules: [`@nuxt/ui`, `nuxt-wallet-kit`],
	walletKit: {
		chains: [`mainnet`, `base`],
	},
});
```

```vue
<template>
	<UApp>
		<header>
			<WalletButton />
		</header>
		<NuxtPage />
	</UApp>
</template>
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `chains` | `ChainName[]` | `['mainnet']` | Export names from `viem/chains`, e.g. `base`, `sepolia`, `arbitrum`. An unknown name fails the build with a clear error. |
| `rpcUrls` | `Partial<Record<ChainName, string>>` | `{}` | RPC URL per chain. Chains without one use the chain's public RPC, which is rate-limited. |
| `labels` | `Partial<WalletKitLabels>` | English | Override any UI string, see below. |

### RPC URLs are public

The browser talks to the RPC directly, so **every RPC URL ends up in the client bundle**. Never put a secret there. With a provider such as Alchemy or Infura, use a key restricted to your domains.

Each URL can be set per environment:

```bash
NUXT_PUBLIC_WALLET_KIT_RPC_URLS_BASE=https://base-mainnet.example.com/your-domain-restricted-key
```

### Labels

```ts
walletKit: {
	labels: {
		connect: `Connecter un wallet`,
		disconnect: `Se déconnecter`,
	},
},
```

Available keys: `connect`, `modalTitle`, `modalDescription`, `noWallet`, `installWallet`, `rejected`, `connectError`, `copyAddress`, `copied`, `copyError`, `viewOnExplorer`, `switchNetwork`, `switchError`, `wrongNetwork`, `disconnect`.

## Components

| Component | Description |
|---|---|
| `<WalletButton />` | Disconnected: a button that opens the wallet picker. Connected: the account menu. Turns into a "Wrong network" warning when the wallet is on a chain you did not configure. |
| `<WalletAccount />` | The account menu alone: copy address, view on block explorer, switch network, disconnect. |

The wallet picker lists the wallets detected in the browser (via [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963)), shows a loading state while connecting, a readable message when the request is rejected, and a link to a wallet guide when none is installed.

Components from your app take precedence: if you create your own `WalletButton.vue`, it replaces the module's.

## Composables

### `useWallet()`

Works with or without Nuxt UI.

| Key | Type | Description |
|---|---|---|
| `address` | `Ref<Address \| undefined>` | Connected address |
| `shortAddress` | `ComputedRef<string \| undefined>` | `0x1234…abcd` |
| `ensName` | `Ref<string \| null \| undefined>` | ENS name, only resolved when `mainnet` is in `chains` |
| `displayName` | `ComputedRef<string \| undefined>` | ENS name, or the short address |
| `chain` / `chainId` / `chains` | | Active chain and configured chains |
| `status` | `Ref<'connected' \| 'connecting' \| 'reconnecting' \| 'disconnected'>` | wagmi connection status |
| `isConnected` | `ComputedRef<boolean>` | `true` as soon as an address is known, including while reconnecting after a reload |
| `isWrongChain` | `ComputedRef<boolean>` | Connected to a chain that is not configured |
| `connect(connector)` | | Connect with a wagmi connector |
| `connectingUid` / `connectErrorMessage` | | Loading and error state of `connect`, scoped to the component that called it |
| `switchChain(id, { onError })` | | Switch network, `onError` receives a readable message |
| `isSwitchingChain` | `ComputedRef<boolean>` | |
| `disconnect()` | | |
| `labels` | `WalletKitLabels` | Resolved labels |

### `useWalletModal()`

Requires Nuxt UI. `open()` opens the wallet picker, and does nothing when a wallet is already connected.

```vue
<script setup lang="ts">
const walletModal = useWalletModal();
</script>

<template>
	<button
		type="button"
		@click="walletModal.open()"
	>
		Connect
	</button>
</template>
```

## How server rendering works

wagmi stores the connection (address, chain id, connector name) in a cookie. On each request, the module reads that cookie and hands the same initial state to the server render and to the browser, so both render the same HTML. The real reconnection to the wallet extension only happens in the browser, after the app is mounted.

The cookie only holds public data: no private key or signature ever goes through the module. Signing and sending transactions always happens in the user's wallet, which asks for confirmation.

## Limitations

- Browser extension wallets only: no WalletConnect (QR code / mobile) yet.
- No Sign-In with Ethereum: the module knows who is connected on the client, it does not authenticate them to your backend.
- ENS names are only resolved when `mainnet` is configured.

## Contribution

<details>
	<summary>Local development</summary>

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground (Sepolia and Base Sepolia)
npm run dev

# Run ESLint
npm run lint

# Run Vitest
npm run test

# Type check
npm run test:types
```

To try the playground, use a browser wallet extension with a dedicated account that holds no real funds.

</details>

## License

MIT

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
