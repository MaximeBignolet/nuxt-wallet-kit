<script setup lang="ts">
const { address, chain, ensName, isConnected, status } = useWallet();
</script>

<template>
	<UApp>
		<header class="flex items-center justify-between border-b border-default px-4 py-3">
			<span class="font-semibold">nuxt-wallet-kit</span>
			<WalletButton />
		</header>
		<main class="mx-auto flex max-w-xl flex-col gap-2 p-4 text-sm">
			<h1 class="text-lg font-semibold">
				Playground
			</h1>
			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
				<dt>Status</dt>
				<dd>{{ status }}</dd>
				<dt>Connected</dt>
				<dd>{{ isConnected }}</dd>
				<dt>Address</dt>
				<dd class="break-all">
					{{ address ?? `—` }}
				</dd>
				<dt>ENS</dt>
				<dd>{{ ensName ?? `—` }}</dd>
				<dt>Chain</dt>
				<dd>{{ chain?.name ?? `—` }}</dd>
			</dl>
		</main>
	</UApp>
</template>
