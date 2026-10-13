# Security policy

## Supported versions

Only the latest published version of `nuxt-wallet-kit` receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub: [Report a vulnerability](https://github.com/MaximeBignolet/nuxt-wallet-kit/security/advisories/new).

Include what you can of:

- the affected version,
- the steps or code to reproduce it,
- the impact you expect (for example: forged wallet state, crash of the server render, data exposed to the client).

This project is maintained by one person on their free time. You can expect an acknowledgement within 7 days. Once a fix is released, the advisory is published and you are credited, unless you prefer to stay anonymous.

## Scope

In scope: the code of this module (`src/`) and the package published on npm.

Out of scope, please report them upstream:

- vulnerabilities in [wagmi](https://github.com/wevm/wagmi), [viem](https://github.com/wevm/viem), [Nuxt](https://github.com/nuxt/nuxt) or [Nuxt UI](https://github.com/nuxt/ui),
- vulnerabilities in a wallet extension,
- applications that use `address` on the server to authorize users, which the [README](./README.md#security) explicitly warns against.
