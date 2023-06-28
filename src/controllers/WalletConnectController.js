/* eslint-disable no-useless-catch */
import { signClient, web3Wallet } from '@/utils/wc'
import LegacySignClient from '@walletconnect/client'
import { getSdkError } from '@walletconnect/utils'

class WalletConnectController {
  /**
   *
   * @type {import('@walletconnect/client').default}
   * @memberof WalletConnectController
   */
  legacySignClient = undefined

  onSignal = (type, data) => ({type, data})

  onConnected = (data) => data

  onDisconnected = (data) => data

  constructor({ 
    onSignal = (type, data) => ({type, data}), 
    onConnected = (data) => data,
    onDisconnected = (data) => data
  }) {
    this.walletConnectConnector = null
    this.selectedAddress = ''
    this.legacySignClient = undefined
    this.EIP155_SIGNING_METHODS = {
      PERSONAL_SIGN: 'personal_sign',
      ETH_SIGN: 'eth_sign',
      ETH_SIGN_TRANSACTION: 'eth_signTransaction',
      ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
      ETH_SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
      ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
      ETH_SEND_RAW_TRANSACTION: 'eth_sendRawTransaction',
      ETH_SEND_TRANSACTION: 'eth_sendTransaction'
    }
    this.onSignal = onSignal
    this.onConnected = onConnected
    this.onDisconnected = onDisconnected
  }

  async init({ wss = '' }) {
    if (!wss || wss === '') {
      console.warn(`WalletConnectController.init: wss is empty`)
      return
    }
  }

  /**
   *
   * @param {Object} param
   * @param {string | undefined} param.uri
   * @memberof WalletConnectController
   */
  async createSignLegacyClient({ uri } = {}) {
    if (uri) {
      await this.deleteCachedLegacySession()
      this.legacySignClient = new LegacySignClient({
        uri
      })
    } else if (!this.legacySignClient && this.getCachedLegacySession()) {
      const session = this.getCachedLegacySession()
      this.legacySignClient = new LegacySignClient({ session })
      if (session.connected) {
        this.onConnected(session)
      }
    } else {
      return
    }

    this.legacySignClient.on('session_request', (error, payload) => {
      if (error) {
        throw new Error(`this.legacySignClient > session_request failed: ${error}`)
      }
      this.onSignal('LegacySessionProposalModal', { legacyProposal: payload })
    })
  
    this.legacySignClient.on('connect', (_, payload) => {
      console.log('this.legacySignClient > connect', payload)
    })
  
    this.legacySignClient.on('error', error => {
      throw new Error(`this.legacySignClient > on error: ${error}`)
    })
  
    this.legacySignClient.on('call_request', (error, payload) => {
      if (error) {
        throw new Error(`this.legacySignClient > call_request failed: ${error}`)
      }
      console.log(`this.legacySignClient > `, payload)
      this.onCallRequest(payload)
    })
  
    this.legacySignClient.on('disconnect', async () => {
      await this.deleteCachedLegacySession()
    })
  }

  onCallRequest(payload){
    switch (payload.method) {
      case this.EIP155_SIGNING_METHODS.ETH_SIGN:
      case this.EIP155_SIGNING_METHODS.PERSONAL_SIGN:
        return this.onSignal('LegacySessionSignModal', {
          legacyCallRequestEvent: payload,
          legacyRequestSession: this.legacySignClient.session
        })
  
      case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
      case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
      case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
        return this.onSignal('LegacySessionSignTypedDataModal', {
          legacyCallRequestEvent: payload,
          legacyRequestSession: this.legacySignClient.session
        })
  
      case this.EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      case this.EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
        return this.onSignal('LegacySessionSendTransactionModal', {
          legacyCallRequestEvent: payload,
          legacyRequestSession: this.legacySignClient.session
        })
  
      default:
        alert(`${payload.method} is not supported for WalletConnect v1`)
    }
  }

  /** 
   * @memberof WalletConnectController
   */
  getCachedLegacySession() {
    if (typeof window === 'undefined') return
    const local = window.localStorage ? window.localStorage.getItem('walletconnect') : null
  
    let session = null
    if (local) {
      try {
        session = JSON.parse(local)
      } catch (error) {
        throw error
      }
    }
    return session
  }

  async deleteCachedLegacySession(version = 1) {
    if (typeof window === 'undefined') return
    if (version === 1) {
      window.localStorage.removeItem('walletconnect')
      if (this.legacySignClient && this.legacySignClient?.session && this.legacySignClient.session?.accounts?.length > 0) {
        try {
          await this.legacySignClient.killSession()
        } catch (error) {
          console.warn(error)
        }
      }
      this.onDisconnected()
    }
  }

  /**
   *
   *
   * @param {Boolean} isInitialized
   * @memberof WalletConnectController
   */
  setupEventManagerHandler(isInitialized = false, version) {
    const onSessionProposal = (proposal) => {
      this.onSignal('SessionProposalModal', { proposal })
    }

    const onSessionProposalV2 = (proposal) => {
      this.onSignal('SessionProposalModal', { proposal })
    }

    const onSessionRequestV2 = (requestEvent) => {
      const { params } = requestEvent
      const { request } = params

      switch (request.method) {
        case this.EIP155_SIGNING_METHODS.ETH_SIGN:
          console.log(`@-> ethSign request`)
          break;
        case this.EIP155_SIGNING_METHODS.PERSONAL_SIGN:
          console.log(`@-> personalSign request`, requestEvent)
          return this.onSignal('SessionSignModal', { requestEvent })

        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
          console.log(`@-> signTypedData request`)
          break
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
          console.log(`@-> signTypedDataV3 request`)
          break;
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
          console.log(`@-> signTypedDataV4 request`)
          return this.onSignal('SessionSignTypedDataModal', { requestEvent })

        case this.EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
          return this.onSignal('SessionSendTransactionModal', { requestEvent })
        default:
          return this.onSignal('SessionUnsuportedMethodModal', { requestEvent })
      }
    }

    const onSessionRequest = (requestEvent) => {
      const { topic, params } = requestEvent
      const { request } = params

      console.log(`@-> topic: `, topic)
      localStorage.setItem('topics', JSON.stringify({
        data: [topic]
      }))

      const requestSession = signClient.session.get(topic)
      switch (request.method) {
        case this.EIP155_SIGNING_METHODS.ETH_SIGN:
          console.log(`@-> ethSign request`)
          break;
        case this.EIP155_SIGNING_METHODS.PERSONAL_SIGN:
          return this.onSignal('SessionSignModal', { requestEvent, requestSession })

        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
          console.log(`@-> signTypedData request`)
          break
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
          console.log(`@-> signTypedDataV3 request`)
          break;
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
          console.log(`@-> signTypedDataV4 request`)
          return this.onSignal('SessionSignTypedDataModal', { requestEvent, requestSession })

        case this.EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
        case this.EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
          return this.onSignal('SessionSendTransactionModal', { requestEvent, requestSession })
        default:
          return this.onSignal('SessionUnsuportedMethodModal', { requestEvent, requestSession })
      }
    }

    if (isInitialized) {
      if (version === 1) {
        signClient.on('session_proposal', onSessionProposal)
        signClient.on('session_request', onSessionRequest)
        signClient.on('session_ping', data => console.log('ping', data))
        signClient.on('session_event', data => console.log('event', data))
        signClient.on('session_update', data => console.log('update', data))
        signClient.on('session_delete', data => {
          console.log('delete', data)
        })
      }

      // V2
      web3Wallet.on('session_proposal', onSessionProposalV2)
      web3Wallet.on('session_request', onSessionRequestV2)
      web3Wallet.on('session_ping', data => console.log('ping', data))
      web3Wallet.on('session_event', data => console.log('event', data))
      web3Wallet.on('session_update', data => console.log('update', data))
      web3Wallet.on('session_delete', async data => {
        await web3Wallet.disconnectSession({
          topic: data.topic,
          reason: getSdkError('USER_DISCONNECTED')
        })
      })
    }
  }
}

export default WalletConnectController