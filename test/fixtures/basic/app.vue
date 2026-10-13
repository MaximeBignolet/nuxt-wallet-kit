<script setup lang="ts">
import { useChains, useConnection } from '@wagmi/vue';

const { address, status } = useConnection();
const chains = useChains();
</script>

<template>
	<UApp>
		<p data-testid="status">
			{{ status }}
		</p>
		<p data-testid="address">
			{{ address }}
		</p>
		<p data-testid="chains">
			{{ chains.map(chain => chain.name).join(`,`) }}
		</p>
		<WalletButton />
	</UApp>
</template>
