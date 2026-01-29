import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  PasskeyValidatorContractVersion,
  toPasskeyValidator,
  toWebAuthnKey,
  WebAuthnMode,
} from '@zerodev/passkey-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { Effect } from 'effect';
import {
  http,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type TypedDataDefinition,
  type WalletClient,
} from 'viem';
import { type Address } from 'viem/accounts';
import { ENTRYPOINT, ZERODEV_PROJECT_ID } from '../config/zerodev';

export type PasskeyValidatorMode = 'register' | 'login';

export interface WebAuthnKey {
  pubX: bigint;
  pubY: bigint;
  authenticatorId: string;
  authenticatorIdHash: Hex;
  rpID: string;
}

export interface CreatePasskeyValidatorParams {
  client: PublicClient<Transport, Chain>;
  passkeyName: string;
  passkeyServerUrl: string;
  mode: PasskeyValidatorMode;
}

export interface StoredWebAuthnKey {
  pubX: string;
  pubY: string;
  authenticatorId: string;
  authenticatorIdHash: Hex;
  rpID: string;
}

export const serializeWebAuthnKey = (
  webAuthnKey: WebAuthnKey
): StoredWebAuthnKey => ({
  pubX: webAuthnKey.pubX.toString(),
  pubY: webAuthnKey.pubY.toString(),
  authenticatorId: webAuthnKey.authenticatorId,
  authenticatorIdHash: webAuthnKey.authenticatorIdHash,
  rpID: webAuthnKey.rpID,
});

export const deserializeWebAuthnKey = (
  stored: StoredWebAuthnKey
): WebAuthnKey => ({
  pubX: BigInt(stored.pubX),
  pubY: BigInt(stored.pubY),
  authenticatorId: stored.authenticatorId,
  authenticatorIdHash: stored.authenticatorIdHash,
  rpID: stored.rpID,
});

export const createPasskeyValidator = async ({
  client,
  passkeyName,
  passkeyServerUrl,
  mode,
}: CreatePasskeyValidatorParams) => {
  const webAuthnMode =
    mode === 'register' ? WebAuthnMode.Register : WebAuthnMode.Login;

  const effect = Effect.gen(function* (_) {
    const webAuthnKey = yield* _(
      Effect.tryPromise({
        try: () =>
          toWebAuthnKey({
            passkeyName,
            passkeyServerUrl,
            mode: webAuthnMode,
            passkeyServerHeaders: {},
          }),
        catch: (error) => error,
      })
    );

    const passkeyValidator = yield* _(
      Effect.tryPromise({
        try: () =>
          toPasskeyValidator(client, {
            webAuthnKey,
            entryPoint: getEntryPoint('0.7'),
            kernelVersion: KERNEL_V3_1,
            validatorContractVersion:
              PasskeyValidatorContractVersion.V0_0_3_PATCHED,
          }),
        catch: (error) => error,
      })
    );

    return { passkeyValidator, webAuthnKey };
  });

  return Effect.runPromise(effect);
};

export const createPasskeyValidatorFromWebAuthnKey = async (
  client: PublicClient<Transport, Chain>,
  storedWebAuthnKey: StoredWebAuthnKey
) => {
  const effect = Effect.gen(function* (_) {
    const webAuthnKey = deserializeWebAuthnKey(storedWebAuthnKey);
    return yield* _(
      Effect.tryPromise({
        try: () =>
          toPasskeyValidator(client, {
            webAuthnKey,
            entryPoint: getEntryPoint('0.7'),
            kernelVersion: KERNEL_V3_1,
            validatorContractVersion:
              PasskeyValidatorContractVersion.V0_0_3_PATCHED,
          }),
        catch: (error) => error,
      })
    );
  });

  return Effect.runPromise(effect);
};

const PROJECT_ID = ZERODEV_PROJECT_ID;

const getAccountAddress = (account: WalletClient['account']) => {
  if (typeof account === 'string') return account;
  return account!.address;
};

export const getKernelClient = async (
  walletClient: WalletClient,
  publicClient: PublicClient<Transport, Chain>,
  chainId: number
) => {
  const effect = Effect.gen(function* (_) {
    if (!walletClient.account) {
      yield* _(Effect.fail(new Error('Wallet client must have an account')));
    }

    if (!publicClient.chain) {
      yield* _(Effect.fail(new Error('Public client must have a chain')));
    }

    const signer = {
      address: getAccountAddress(walletClient.account),
      signMessage: async ({ message, raw }: { message?: any; raw?: any }) => {
        return walletClient.signMessage({
          message: message || raw,
          account: walletClient.account!,
        });
      },
      signTypedData: async (params: TypedDataDefinition) => {
        return walletClient.signTypedData({
          ...params,
          account: walletClient.account!,
        });
      },
      type: 'json-rpc' as const,
    };

    const ecdsaValidator = yield* _(
      Effect.tryPromise({
        try: () =>
          signerToEcdsaValidator(publicClient, {
            signer: signer as any,
            entryPoint: ENTRYPOINT,
            kernelVersion: KERNEL_V3_1,
          }),
        catch: (error) => error,
      })
    );

    const account = yield* _(
      Effect.tryPromise({
        try: () =>
          createKernelAccount(publicClient, {
            plugins: {
              sudo: ecdsaValidator,
            },
            entryPoint: ENTRYPOINT,
            kernelVersion: KERNEL_V3_1,
          }),
        catch: (error) => error,
      })
    );

    const bundlerUrl = `https://rpc.zerodev.app/api/v3/${PROJECT_ID}/chain/${chainId}`;
    const paymasterClient = createZeroDevPaymasterClient({
      chain: publicClient.chain,
      transport: http(bundlerUrl),
    });

    const kernelClient = createKernelAccountClient({
      account,
      chain: publicClient.chain,
      bundlerTransport: http(bundlerUrl),
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          });
        },
      },
    });

    return { kernelClient, account, ecdsaValidator };
  });

  return Effect.runPromise(effect);
};

export const getKernelClientWithPasskey = async (
  publicClient: PublicClient<Transport, Chain>,
  chainId: number,
  storedWebAuthnKey: StoredWebAuthnKey,
  address?: Address
) => {
  const effect = Effect.gen(function* (_) {
    if (!publicClient.chain) {
      yield* _(Effect.fail(new Error('Public client must have a chain')));
    }

    const passkeyValidator = yield* _(
      Effect.tryPromise({
        try: () =>
          createPasskeyValidatorFromWebAuthnKey(
            publicClient,
            storedWebAuthnKey
          ),
        catch: (error) => error,
      })
    );

    const account = yield* _(
      Effect.tryPromise({
        try: () =>
          createKernelAccount(publicClient, {
            plugins: {
              sudo: passkeyValidator,
            },
            entryPoint: ENTRYPOINT,
            kernelVersion: KERNEL_V3_1,
            address: address,
          }),
        catch: (error) => error,
      })
    );

    const bundlerUrl = `https://rpc.zerodev.app/api/v3/${PROJECT_ID}/chain/${chainId}`;
    const paymasterClient = createZeroDevPaymasterClient({
      chain: publicClient.chain,
      transport: http(bundlerUrl),
    });

    const kernelClient = createKernelAccountClient({
      account,
      chain: publicClient.chain,
      bundlerTransport: http(bundlerUrl),
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          });
        },
      },
    });

    return { kernelClient, account, passkeyValidator };
  });

  return Effect.runPromise(effect);
};

export { createKernelAccount };
