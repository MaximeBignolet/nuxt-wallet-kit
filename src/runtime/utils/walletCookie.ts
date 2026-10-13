import { cookieStorage, cookieToInitialState } from '@wagmi/vue';
import type { Config, State } from '@wagmi/vue';
import { isAddress } from 'viem';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === `object` && value !== null;

const isConnector = (value: unknown) => isRecord(value)
	&& [`id`, `name`, `type`, `uid`].every(key => typeof value[key] === `string`);

const isConnection = (value: unknown) => isRecord(value)
	&& Array.isArray(value.accounts)
	&& value.accounts.length > 0
	&& value.accounts.every(account => typeof account === `string` && isAddress(account))
	&& Number.isSafeInteger(value.chainId)
	&& isConnector(value.connector);

const isWalletState = (value: unknown): value is State => {
	if (!isRecord(value) || !(value.connections instanceof Map) || !Number.isSafeInteger(value.chainId)) {
		return false;
	}
	const connections = value.connections;
	const entriesAreValid = [...connections.entries()].every(([uid, connection]) => typeof uid === `string` && isConnection(connection));
	const currentIsValid = value.current === null || value.current === undefined || (typeof value.current === `string` && connections.has(value.current));
	return entriesAreValid && currentIsValid;
};

export const readWalletState = (config: Config, cookie: string | null | undefined) => {
	const state = cookieToInitialState(config, cookie);
	return isWalletState(state) ? state : undefined;
};

const secureAttribute = () => window.location.protocol === `https:` ? `;secure` : ``;

export const walletCookieStorage = {
	getItem: (key: string) => cookieStorage.getItem(key),
	setItem(key: string, value: string) {
		if (typeof window === `undefined`) {
			return;
		}
		document.cookie = `${key}=${value};path=/;samesite=lax${secureAttribute()}`;
	},
	removeItem(key: string) {
		if (typeof window === `undefined`) {
			return;
		}
		document.cookie = `${key}=;max-age=-1;path=/;samesite=lax${secureAttribute()}`;
	},
};
