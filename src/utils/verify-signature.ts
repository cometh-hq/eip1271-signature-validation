import { createPublicClient, http, PublicClient } from "viem";

type INetworkValidSig = { chainId: number | null; valid: boolean };

const checkSignatureForAllClients = async (
  clients: PublicClient[],
  walletAddress: `0x${string}`,
  message: string,
  signature: `0x${string}` | Uint8Array
): Promise<(INetworkValidSig | null)[]> => {
  return Promise.all(
    clients.map(async (client) => {
      const valid = await client.verifyMessage({
        address: walletAddress,
        message,
        signature,
      });

      try {
        const chainId = await client.getChainId()

        return { chainId: chainId || null, valid: !!valid };
      } catch (e) {
        //
      }

      return null;
    })
  );
};

const getClientsFromRpcUrls = async (rpcUrls: string[]) => {
  return Promise.all(
    rpcUrls.map(async (rpcUrl) => {
      const client: PublicClient = createPublicClient({
        transport: http(rpcUrl),
      });
      try {
        const chainId = await client.getChainId()
        if (!!chainId) return client;
      } catch (e) {
        //
      }

      return null;
    })
  );
};

/**
 * @param {string[]} rpcUrls Array of RPC URLs to create providers to perform smart contract wallet validation with EIP 1271
 * @param {string} walletAddress The signer address to verify the signature against
 * @param {string} message message used to generate the signature. 
 * @param {string} signature The signature to verify as a hex string
 * @returns {Promise<INetworkSigValid>} INetworkValidSig is an array of objects { name: NetworksNames, valid: boolean }
 */
export const isValidEip1271SignatureForAllNetworks = async (
  rpcUrls: string[],
  walletAddress: `0x${string}`,
  message: string,
  signature: `0x${string}` | Uint8Array
): Promise<INetworkValidSig[]> => {
  if (!rpcUrls.length || !walletAddress || !message || !signature) return [];

  const clients = await getClientsFromRpcUrls(rpcUrls);
  const validClients = clients.flatMap((f) => (!!f ? [f] : [])); // Filter out unrecognized provider urls
  const networkValidSignatures = await checkSignatureForAllClients(validClients, walletAddress, message, signature);
  return networkValidSignatures.flatMap((f) => (!!f?.chainId ? [f] : [])); // Filter out failed attempts
};

/**
 * @param {string[]} rpcUrls Array of RPC URLs to create providers to perform smart contract wallet validation with EIP 1271
 * @param {`0x${string}`} walletAddress The signer address to verify the signature against
 * @param {string} message message used to generate the signature. 
 * @param {`0x${string}` | Uint8Array} signature The signature to verify as a hex string
 * @returns {Promise<boolean>}
 */
export const isValidEip1271Signature = async (
  rpcUrls: string[],
  walletAddress: `0x${string}`,
  message: string,
  signature: `0x${string}` | Uint8Array
): Promise<boolean> => {
  const validArr = await isValidEip1271SignatureForAllNetworks(rpcUrls, walletAddress, message, signature);
  return validArr.some((item) => !!item.valid);
};
