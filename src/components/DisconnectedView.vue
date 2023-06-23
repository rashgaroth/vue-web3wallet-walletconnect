<template>
  <div class="flex flex-col space-y-2 items-center">
    <p class="text-gray-200">Connect your account to <strong class="text-text-main">Wallet Street</strong></p>
    <vs-button block color="#EA6559" @click="setIsOpen(true)">
      Connect
    </vs-button>
    <vs-dialog v-model="openConnectDialog" not-padding>
      <div class="flex flex-col bg-gray-900 p-5 rounded-xl space-y-5">
        <h4 class="not-margin text-gray-200">
          Welcome to <b class="text-text-main">Wallet Street POC</b>
        </h4>
        <div class="w-full flex flex-row justify-center">
          <vs-input 
            :danger="error" 
            v-model="email" 
            placeholder="Email" 
            type="email"
            name="email"
            id="email"
            class="w-full block" 
            :state="error ? 'danger' : '#FFF'"
          >
            <template #icon>
              @
            </template>
          </vs-input>
        </div>
        <div class="footer-dialog">
          <vs-button block color="#EA6559" @click="onSubmit()" :loading="isLoading">
            Sign In
          </vs-button>
        </div>
      </div>
    </vs-dialog>
  </div>
</template>

<script>
import { fetchUserWallet } from '../gql/mutations'

export default {
  name: 'DisconnectedView',
  props: {
    msg: String,
    onConnected: Function
  },
  data: () => ({
    active: 0,
    openConnectDialog: false,
    email: '',
    error: false,
    isLoading: false,
  }),
  watch: {
    email: function(val){
      if (val !== '' && val) {
        this.error = false
      }
    }
  },
  methods: {
    setIsOpen(value) {
      this.openConnectDialog = value
      this.email = ''
    },
    async onSubmit() {
      if (this.email === '' || !this.email) {
        this.error = true
        return
      }
      this.isLoading = true
      try {
        const gqlData = await fetchUserWallet(this.email)
        if (gqlData.data.res) {
          const address = gqlData.data.res
          localStorage.setItem('selectedAddress', address)
          this.onConnected(address)
        }
        localStorage.setItem('email', this.email)
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
      }
    }
  }
}
</script>
