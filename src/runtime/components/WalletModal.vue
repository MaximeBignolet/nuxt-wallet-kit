<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useConnectors } from '@wagmi/vue';
import type { Connector } from '@wagmi/vue';
import UAlert from '@nuxt/ui/components/Alert.vue';
import UAvatar from '@nuxt/ui/components/Avatar.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UModal from '@nuxt/ui/components/Modal.vue';
import { useWallet } from '../composables/useWallet';

const INSTALL_GUIDE_URL = `https://ethereum.org/en/wallets/find-wallet/`;

const emit = defineEmits<{ close: [] }>();

const connectors = useConnectors();
const { connect, connectErrorMessage, connectingUid, isConnected, labels } = useWallet();

const wallets = computed<readonly Connector[]>(() => {
	const detected = connectors.value.filter(connector => connector.id !== `injected`);
	if (detected.length > 0) {
		return detected;
	}
	return hasInjectedProvider.value ? connectors.value : [];
});

const hasInjectedProvider = ref(import.meta.client && `ethereum` in window);

watch(isConnected, (connected) => {
	if (connected) {
		emit(`close`);
	}
});
</script>

<template>
	<UModal
		:title="labels.modalTitle"
		:description="labels.modalDescription"
	>
		<template #body>
			<div class="flex flex-col gap-3">
				<UAlert
					v-if="connectErrorMessage"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					:title="connectErrorMessage"
				/>
				<ul
					v-if="wallets.length > 0"
					class="flex flex-col gap-2"
				>
					<li
						v-for="wallet in wallets"
						:key="wallet.uid"
					>
						<UButton
							block
							color="neutral"
							variant="outline"
							size="lg"
							class="justify-start"
							:loading="connectingUid === wallet.uid"
							:disabled="Boolean(connectingUid)"
							@click="connect(wallet)"
						>
							<UAvatar
								v-if="wallet.icon"
								:src="wallet.icon"
								alt=""
								size="xs"
							/>
							{{ wallet.name }}
						</UButton>
					</li>
				</ul>
				<div
					v-else
					class="flex flex-col items-start gap-2 text-sm"
				>
					<p>{{ labels.noWallet }}</p>
					<UButton
						:to="INSTALL_GUIDE_URL"
						target="_blank"
						variant="link"
						trailing-icon="i-lucide-external-link"
						:label="labels.installWallet"
						class="px-0"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
