import { createPublicClient, http, PublicClient } from 'viem'
import {
  mainnet,
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado,
  polygon,
  polygonMumbai
} from 'viem/chains'

const supportedChains = [
  mainnet,
  polygon,
  polygonMumbai,
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado
]

type INetworkValidSig = { chainId: number | null; valid: boolean }

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
        signature
      })

      const chainId = await client.getChainId()

      return { chainId: chainId || null, valid: !!valid }
    })
  )
}

const getClientsFromRpcUrls = async () => {
  return Promise.all(
    supportedChains.map(async (chain) => {
      const client: PublicClient = createPublicClient({
        chain,
        transport: http()
      })
      try {
        const chainId = await client.getChainId()
        if (!!chainId) return client
      } catch (e) {
        console.warn(`Client creation for ${chain} got an error`)
      }

      return null
    })
  )
}

/**
 * @param {string | `0x${string}`} walletAddress The signer address to verify the signature against
 * @param {string} message message used to generate the signature.
 * @param {string | `0x${string}` | Uint8Array} signature The signature to verify as a hex string
 * @returns {Promise<INetworkSigValid>} INetworkValidSig is an array of objects { name: NetworksNames, valid: boolean }
 */
export const isValidEip1271SignatureForAllNetworks = async (
  walletAddress: string | `0x${string}`,
  message: string,
  signature: string | `0x${string}` | Uint8Array
): Promise<INetworkValidSig[]> => {
  if (!walletAddress || !message || !signature) return []

  const clients = await getClientsFromRpcUrls()
  const validClients = clients.flatMap((f) => (!!f ? [f] : []))
  const networkValidSignatures = await checkSignatureForAllClients(
    validClients,
    walletAddress as `0x${string}`,
    message,
    signature as `0x${string}` | Uint8Array
  )
  return networkValidSignatures.flatMap((f) => (!!f?.chainId ? [f] : [])) // Filter out failed attempts
}

/**
 * @param {string | `0x${string}`} walletAddress The signer address to verify the signature against
 * @param {string} message message used to generate the signature.
 * @param {string | `0x${string}` | Uint8Array} signature The signature to verify as a hex string
 * @returns {Promise<boolean>}
 */
export const isValidEip1271Signature = async (
  walletAddress: string | `0x${string}`,
  message: string,
  signature: string | `0x${string}` | Uint8Array
): Promise<boolean> => {
  const validArr = await isValidEip1271SignatureForAllNetworks(
    walletAddress,
    message,
    signature
  )
  return validArr.some((item) => !!item.valid)
}
