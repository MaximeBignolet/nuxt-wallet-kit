import { useConnection } from '@wagmi/vue';
import { useOverlay } from '@nuxt/ui/composables';
import WalletModal from '../components/WalletModal.vue';

export const useWalletModal = () => {
	const overlay = useOverlay();
	const { address } = useConnection();

	const open = () => {
		if (address.value) {
			return;
		}
		overlay.create(WalletModal, { destroyOnClose: true }).open();
	};

	return { open };
};
