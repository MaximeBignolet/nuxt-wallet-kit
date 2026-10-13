<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import { useWallet } from '../composables/useWallet';
import { useWalletModal } from '../composables/useWalletModal';
import WalletAccount from './WalletAccount.vue';

const { isConnected, labels } = useWallet();
const walletModal = useWalletModal();

function openWalletModal() {
	walletModal.open();
}
</script>

<template>
	<WalletAccount v-if="isConnected" />
	<UButton
		v-else
		:label="labels.connect"
		icon="i-lucide-wallet"
		@click="openWalletModal"
	/>
</template>
