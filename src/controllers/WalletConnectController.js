/* eslint-disable no-useless-catch */
import { signClient } from '@/utils/wc'
import LegacySignClient from '@walletconnect/client'

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

  async deleteCachedLegacySession() {
    if (typeof window === 'undefined') return
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

  /**
   *
   *
   * @param {Boolean} isInitialized
   * @memberof WalletConnectController
   */
  setupEventManagerHandler(isInitialized = false) {
    const onSessionProposal = (proposal) => {
      this.onSignal('SessionProposalModal', { proposal })
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
      signClient.on('session_proposal', onSessionProposal)
      signClient.on('session_request', onSessionRequest)
      signClient.on('session_ping', data => console.log('ping', data))
      signClient.on('session_event', data => console.log('event', data))
      signClient.on('session_update', data => console.log('update', data))
      signClient.on('session_delete', data => {
        console.log('delete', data)
      })
    }
  }
}

export default WalletConnectController