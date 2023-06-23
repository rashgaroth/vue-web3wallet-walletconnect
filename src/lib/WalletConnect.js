import Connector from '@walletconnect/core'
import * as cryptoLib from '@walletconnect/iso-crypto'

class WalletConnect extends Connector {
  constructor(connectorOpts, pushServerOpts) {
    super({
      cryptoLib,
      pushServerOpts,
      connectorOpts,
    })
  }
}

export default WalletConnect
