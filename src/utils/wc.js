/* eslint-disable no-unused-vars */
import { Core } from '@walletconnect/core'
import SignClient from '@walletconnect/sign-client'
import { Web3Wallet } from '@walletconnect/web3wallet'

/**
 * @type {SignClient} signClient
 */
export let signClient

/**
 * @type {import('@walletconnect/web3wallet').IWeb3Wallet} signClient
 */
export let web3Wallet

/**
 * @type {import('@walletconnect/core').default} signClient
 */
export let core

export async function createSignClient(relayerRegionURL = "wss://relay.walletconnect.com") {
  signClient = await SignClient.init({
    logger: 'debug',
    projectId: process.env.VUE_APP_WC_PROJECT_ID,
    relayUrl: relayerRegionURL ?? "wss://relay.walletconnect.com",
    metadata: {
      name: 'Wallet Street',
      description: 'Wallet Street for WalletConnect',
      url: 'https://walletconnect.com/',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    }
  })
}

export async function pair({ uri }){
  return await web3Wallet.core.pairing.pair({ uri })
}

export async function createWeb3WalletV2() {
  const metadata = {
    description: "Wallet Street for WalletConnect",
    name: "Wallet Street",
    url: "https://walletconnect.com",
    icons: []
  }

  const _core = new Core({
    projectId: process.env.VUE_APP_WC_PROJECT_ID,
  })

  const _web3Wallet = await Web3Wallet.init({
    core: _core,
    metadata: `${metadata}`
  })

  core = _core
  web3Wallet = _web3Wallet
}

export async function updateSignClientChainId(chainId, address) {
  // get most recent session
  const session = signClient.session.getAll()[0]
  if (!session) return

  // if chainId does not exist in session, an update is required first
  if (!session.namespaces[chainId]) {
    const newNamespace = {
      [chainId]: {
        accounts: [`${chainId}:${address}`],
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }
    try {
      // need to wait for update to finish before emit
      await signClient.update({
        topic: session.topic,
        namespaces: { ...session.namespaces, ...newNamespace }
      })
    } catch (err) {
      console.error(`Failed to update session: ${err}`)
    }
  }

  const payload = {
    topic: session.topic,
    event: {
      name: 'chainChanged',
      data: [address]
    },
    chainId
  }

  try {
    signClient.emit(payload)
  } catch (err) {
    console.error(`Failed to emit chainChanged event: ${err}`)
  }
}
