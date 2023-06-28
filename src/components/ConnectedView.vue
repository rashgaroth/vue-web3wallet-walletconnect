<template>
  <div class="hello">
    <div class="flex flex-col space-y-5 items-center">
      <p class="text-2xl font-bold">Welcome to <b class="text-text-main">Wallet Street</b></p>
      <p class="text-sm">PoC for <b class="text-text-main">Wallet Street</b> integrating with <b class="text-blue-500">Wallet Connect</b></p>
      <div class="flex flex-row items-center space-x-5 bg-gray-900 rounded-xl px-5 py-2">
        <p>{{ address }}</p>
        <vs-button block color="#6E27D8" @click="copyAddress()">
          {{ copyText  }}
        </vs-button>
      </div>
      <div v-if="dappConnected === false" class="grid grid-cols-2 gap-2">
        <vs-button block color="#6E27D8" @click="openModal()">
          Connect to dapp
        </vs-button>
        <vs-button block danger state="danger" @click="disconnect()">
          Disconnect
        </vs-button>
      </div>
      <div v-else class="grid grid-cols-1 gap-1 w-full">
        <vs-button block color="success" state="success" success disabled>
          Connected
        </vs-button>
      </div>      
    </div>

    <vs-dialog v-model="openConnectModal" not-padding>
      <div class="flex flex-col bg-gray-900 p-5 rounded-xl space-y-5">
        <h4 class="not-margin text-gray-200">
          Please input <b class="text-text-main">Wallet Connect wss</b> link
        </h4>
        <div>
          <p class="text-sm text-gray-200">
            You can get it from <a href="https://example.walletconnect.org/" target="_blank" class="text-blue-500">here</a>
          </p>
        </div>
        <div class="w-full flex flex-row justify-center">
          <vs-input 
            :danger="error" 
            v-model="wss" 
            class="w-full block" 
            placeholder="wss://example.com"
            :state="error ? 'danger' : '#FFF'"
          >
          </vs-input>
        </div>
        <div class="footer-dialog">
          <vs-button block color="#6E27D8" @click="onSubmit()" :loading="isLoading">
            Connect
          </vs-button>
        </div>
      </div>
    </vs-dialog>

    <vs-dialog width="120px" not-padding v-model="openDisconnectModal">
      <div class="p-5 bg-gray-800 rounded-xl space-y-5">
        <h4 class="not-margin text-gray-200">
          Are you sure want to <b class="text-red-500">disconnect</b>
        </h4>
  
        <div class="con-footer flex flex-row items-center justify-end">
          <vs-button @click="onDisconnect()" danger state="danger">
            Disconnect
          </vs-button>
          <vs-button @click="openDisconnectModal=false">
            Cancel
          </vs-button>
        </div>
      </div>
    </vs-dialog>
  </div>
</template>

<script>
import { parseUri } from '@walletconnect/utils'

export default {
  name: 'ConnectedView',
  props: {
    address: String,
    onWssConnected: Function,
    dappConnected: Boolean,
    onWalletConnectDisconnectRequest: {},
    onDisconnect: {}
  },
  data: () => ({
    copied: false,
    copyText: "Copy",
    openConnectModal: false,
    isLoading: false,
    error: false,
    wss: '',
    openDisconnectModal: false
  }),
  methods: {
    copyAddress(){
      this.copied = true
      this.copyText = "Copied"
      navigator.clipboard.writeText(this.address)
      setTimeout(() => {
        this.copied = false
        this.copyText = "Copy"
      }, 2000)
    },
    openModal(){
      this.openConnectModal = true
    },
    disconnect() {
      this.openDisconnectModal = true
    },
    onSubmit() {
      const parsed = parseUri(this.wss)
      if (parsed.protocol !== "wc") {
        console.error(`Wrong value`)
        return
      }
      this.onWssConnected(parsed.version, this.wss)
      this.openConnectModal = false
      this.wss = ''
    },
    async disconnectWalletConnect() {
      await this.onWalletConnectDisconnectRequest()
    }
  }
}
</script>
