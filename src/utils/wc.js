import SignClient from '@walletconnect/sign-client'

/**
 * @type {SignClient} signClient
 */
export let signClient

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
  console.log(`@-> incoming sessions: `, signClient.session.getAll())
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
