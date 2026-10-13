import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';
import { useChains, useConnect, useConnection, useDisconnect, useEnsName, useSwitchChain } from '@wagmi/vue';
import type { Connector } from '@wagmi/vue';

const MAINNET_ID = 1;

const isRejection = (error: Error) => error.name === `UserRejectedRequestError`;

export const useWallet = () => {
	const { labels } = useRuntimeConfig().public.walletKit;
	const { address, chain, chainId, status } = useConnection();
	const chains = useChains();
	const { mutate: connectMutate, error: connectError, status: connectStatus, variables: connectVariables } = useConnect();
	const { disconnect } = useDisconnect();
	const { mutate: switchChainMutate, status: switchStatus } = useSwitchChain();

	const hasMainnet = computed(() => chains.value.some(item => item.id === MAINNET_ID));
	const { data: ensName } = useEnsName({
		address,
		chainId: MAINNET_ID,
		query: { enabled: hasMainnet },
	});

	const isConnected = computed(() => Boolean(address.value));
	const isWrongChain = computed(() => isConnected.value && !chain.value);
	const shortAddress = computed(() => address.value ? `${address.value.slice(0, 6)}…${address.value.slice(-4)}` : undefined);
	const displayName = computed(() => ensName.value ?? shortAddress.value);
	const connectingUid = computed(() => {
		const connector = connectVariables.value?.connector;
		return connectStatus.value === `pending` && connector && `uid` in connector ? connector.uid : undefined;
	});
	const connectErrorMessage = computed(() => {
		if (!connectError.value) {
			return undefined;
		}
		return isRejection(connectError.value) ? labels.rejected : labels.connectError;
	});

	const connect = (connector: Connector) => connectMutate({ connector });

	const switchChain = (id: number, options: { onError?: (message: string) => void } = {}) => switchChainMutate({ chainId: id }, {
		onError: error => options.onError?.(isRejection(error) ? labels.rejected : labels.switchError),
	});

	return {
		address,
		chain,
		chainId,
		chains,
		connect,
		connectErrorMessage,
		connectingUid,
		disconnect: () => disconnect(),
		displayName,
		ensName,
		isConnected,
		isSwitchingChain: computed(() => switchStatus.value === `pending`),
		isWrongChain,
		labels,
		shortAddress,
		status,
		switchChain,
	};
};
