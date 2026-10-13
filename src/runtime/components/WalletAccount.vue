<script setup lang="ts">
import { computed } from 'vue';
import type { DropdownMenuItem } from '@nuxt/ui';
import { useToast } from '@nuxt/ui/composables';
import UButton from '@nuxt/ui/components/Button.vue';
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue';
import { useWallet } from '../composables/useWallet';

const { address, chain, chainId, chains, disconnect, displayName, isSwitchingChain, isWrongChain, labels, switchChain } = useWallet();
const toast = useToast();

const explorerUrl = computed(() => {
	const explorer = chain.value?.blockExplorers?.default.url;
	return explorer && address.value ? `${explorer}/address/${address.value}` : undefined;
});

const items = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: labels.copyAddress,
			icon: `i-lucide-copy`,
			onSelect: copyAddress,
		},
		...(explorerUrl.value
			? [{
					label: labels.viewOnExplorer,
					icon: `i-lucide-external-link`,
					to: explorerUrl.value,
					target: `_blank`,
				}]
			: []),
	],
	[
		{
			label: labels.switchNetwork,
			icon: `i-lucide-network`,
			disabled: isSwitchingChain.value,
			children: chains.value.map(item => ({
				label: item.name,
				type: `checkbox` as const,
				checked: item.id === chainId.value,
				onSelect: () => switchChain(item.id, { onError: notifyError }),
			})),
		},
	],
	[
		{
			label: labels.disconnect,
			icon: `i-lucide-log-out`,
			color: `error`,
			onSelect: disconnect,
		},
	],
]);

function copyAddress() {
	if (!address.value) {
		return;
	}
	navigator.clipboard.writeText(address.value)
		.then(() => toast.add({ title: labels.copied, icon: `i-lucide-check` }))
		.catch(() => notifyError(labels.copyError));
}

function notifyError(message: string) {
	toast.add({ title: message, color: `error`, icon: `i-lucide-circle-alert` });
}
</script>

<template>
	<UDropdownMenu
		:items="items"
		:content="{ align: `end` }"
	>
		<UButton
			:color="isWrongChain ? `warning` : `neutral`"
			variant="outline"
			:icon="isWrongChain ? `i-lucide-triangle-alert` : `i-lucide-wallet`"
			:label="isWrongChain ? labels.wrongNetwork : displayName"
		/>
	</UDropdownMenu>
</template>
