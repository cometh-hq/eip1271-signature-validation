# EIP1271 Module

A simple library to validate EIP1271 signatures.

### Usage

Simple usage

```ts
import {
  isValidEip1271Signature,
  isValidEip1271SignatureForAllNetworks
} from '@cometh/eip1271-verification-util'
import { hashMessage } from 'viem'
import { MNEMONIC, RPC, EIP712_SAFE_MESSAGE_TYPE } from './constants'

const checkSig = async () => {
  const signer = ethers.Wallet.fromMnemonic(MNEMONIC)
  const messageToSign = '0x123456'

  const rpcUrls = [RPC.polygon, RPC.xdai] // Array of RPC URLs to create providers to perform smart contract wallet validation with EIP 1271
  const signature = await signer._signTypedData(
    {
      chainId,
      verifyingContract: walletAddress // The wallet address to verify the signature against
    },
    EIP712_SAFE_MESSAGE_TYPE,
    { message: hashMessage(messageToSign) }
  )

  const isValidSig = await isValidEip1271Signature(
    rpcUrls,
    walletAddress,
    message,
    signature
  )

  console.log('is signature valid:', isValidSig) // Returns a single boolean

  const isValidSigPerNetwork = await isValidEip1271SignatureForAllNetworks(
    rpcUrls,
    walletAddress,
    message,
    signature
  )

  console.log('is signature valid for each network:', isValidSigPerNetwork) // Returns an array of booleans with chainId for each network you provided a RPC URL for eg. [{ chainId: 1, name: "mainnet", valid: true }, { chainId: 56, name: "bnb", valid: false }, ...]
}
```
