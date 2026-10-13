export interface FakeWalletOptions {
	account: string;
	chainId: number;
	rejectConnect: boolean;
}

export const installFakeWallet = ({ account, chainId, rejectConnect }: FakeWalletOptions) => {
	const CONNECTED_KEY = `fake-wallet:connected`;
	const listeners = new Map<string, Set<(payload: unknown) => void>>();
	let currentChainId = `0x${chainId.toString(16)}`;

	const emit = (event: string, payload: unknown) => {
		listeners.get(event)?.forEach(listener => listener(payload));
	};

	const isConnected = () => localStorage.getItem(CONNECTED_KEY) === `1`;

	const rpcError = (code: number, message: string) => Object.assign(new Error(message), { code });

	const provider = {
		async request({ method, params }: { method: string; params?: [{ chainId: string }] }) {
			switch (method) {
				case `eth_requestAccounts`:
					if (rejectConnect) {
						throw rpcError(4001, `User rejected the request.`);
					}
					localStorage.setItem(CONNECTED_KEY, `1`);
					return [account];
				case `eth_accounts`:
					return isConnected() ? [account] : [];
				case `eth_chainId`:
					return currentChainId;
				case `net_version`:
					return String(Number.parseInt(currentChainId, 16));
				case `wallet_switchEthereumChain`:
					currentChainId = params?.[0].chainId ?? currentChainId;
					emit(`chainChanged`, currentChainId);
					return null;
				case `wallet_revokePermissions`:
					localStorage.removeItem(CONNECTED_KEY);
					return null;
				default:
					throw rpcError(4200, `Unsupported method: ${method}`);
			}
		},
		on(event: string, listener: (payload: unknown) => void) {
			if (!listeners.has(event)) {
				listeners.set(event, new Set());
			}
			listeners.get(event)?.add(listener);
		},
		removeListener(event: string, listener: (payload: unknown) => void) {
			listeners.get(event)?.delete(listener);
		},
	};

	const announce = () => {
		window.dispatchEvent(new CustomEvent(`eip6963:announceProvider`, {
			detail: Object.freeze({
				info: {
					uuid: `00000000-0000-4000-8000-000000000000`,
					name: `Test Wallet`,
					icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>`,
					rdns: `test.wallet`,
				},
				provider,
			}),
		}));
	};

	window.addEventListener(`eip6963:requestProvider`, announce);
	announce();
};
