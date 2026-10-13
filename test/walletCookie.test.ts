import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConfig, http } from '@wagmi/core';
import { sepolia } from 'viem/chains';
import { readWalletState, walletCookieStorage } from '../src/runtime/utils/walletCookie';

const ADDRESS = `0x1111111111111111111111111111111111111111`;
const CONNECTOR = { id: `injected`, name: `Injected`, type: `injected`, uid: `u` };

const config = createConfig({ chains: [sepolia], transports: { [sepolia.id]: http() } });

const cookieOf = (state: unknown) => `wagmi.store=${JSON.stringify({ state, version: 3 })}`;

const stateWith = (connection: Record<string, unknown>, extra: Record<string, unknown> = {}) => cookieOf({
	connections: { __type: `Map`, value: [[`u`, { accounts: [ADDRESS], chainId: sepolia.id, connector: CONNECTOR, ...connection }]] },
	current: `u`,
	chainId: sepolia.id,
	...extra,
});

describe(`readWalletState`, () => {
	it(`accepts a well-formed wallet cookie`, () => {
		const state = readWalletState(config, stateWith({}));
		expect(state?.connections.get(`u`)?.accounts).toEqual([ADDRESS]);
	});

	it.each([
		[`no cookie`, undefined],
		[`invalid JSON`, `wagmi.store={broken`],
		[`null state`, `wagmi.store={"state":null}`],
		[`connections as a plain object`, cookieOf({ connections: {}, current: `u`, chainId: sepolia.id })],
		[`connections as null`, cookieOf({ connections: null, current: `u`, chainId: sepolia.id })],
		[`connector set to null`, stateWith({ connector: null })],
		[`connector with missing fields`, stateWith({ connector: { id: `injected` } })],
		[`accounts as a string`, stateWith({ accounts: ADDRESS })],
		[`empty accounts`, stateWith({ accounts: [] })],
		[`account that is not an address`, stateWith({ accounts: [`<img src=x onerror=alert(1)>`] })],
		[`address with a wrong checksum`, stateWith({ accounts: [`0xAbCdEf0000000000000000000000000000000000`] })],
		[`chain id as a string`, stateWith({ chainId: `11155111` })],
		[`current pointing to an unknown connection`, stateWith({}, { current: `other` })],
		[`chain id as a bigint`, stateWith({}, { chainId: { __type: `bigint`, value: `9`.repeat(500) } })],
	])(`rejects %s`, (_name, cookie) => {
		expect(readWalletState(config, cookie)).toBeUndefined();
	});

	it(`does not pollute Object.prototype`, () => {
		readWalletState(config, `wagmi.store={"state":{"__proto__":{"polluted":true}}}`);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
});

describe(`walletCookieStorage`, () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const stubBrowser = (protocol: string) => {
		const document = { cookie: `` };
		vi.stubGlobal(`window`, { location: { protocol } });
		vi.stubGlobal(`document`, document);
		return document;
	};

	it(`adds the Secure attribute on HTTPS`, () => {
		const document = stubBrowser(`https:`);
		walletCookieStorage.setItem(`wagmi.store`, `{}`);
		expect(document.cookie).toBe(`wagmi.store={};path=/;samesite=lax;secure`);
	});

	it(`omits the Secure attribute on plain HTTP so local development keeps working`, () => {
		const document = stubBrowser(`http:`);
		walletCookieStorage.setItem(`wagmi.store`, `{}`);
		expect(document.cookie).toBe(`wagmi.store={};path=/;samesite=lax`);
	});
});
