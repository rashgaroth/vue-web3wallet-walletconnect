<template>
  <div class="hello">
    <!-- eslint-disable-next-line vue/no-mutating-props -->
    <vs-dialog v-model="openModal" not-padding>
      <div class="flex flex-col bg-gray-900 p-5 rounded-xl space-y-5">
        <h4 class="text-gray-200 ml-2">
          <strong class="text-text-main">{{ dappName }}</strong> Wants to connect
        </h4>
        <div class="p-2 mx-2 rounded-lg bg-gray-300 flex flex-col space-y-1">
          <code>
            id: {{ requestId }}
          </code>
          <code>
            dapp name: {{ dappName }}
          </code>
          <code>
            dapp url: <a :href="dappUrl" class="text-blue-400" target="_blank">{{ dappUrl }}</a>
          </code>
        </div>
        <div class="footer-dialog flex flex-row items-center">
          <vs-button block color="#6E27D8" @click="onRequest('approve')" :loading="isLoading">
            Approve
          </vs-button>
          <vs-button block danger state="danger" @click="onRequest('reject')" :loading="isLoading">
            Reject
          </vs-button>
        </div>
      </div>
    </vs-dialog>
  </div>
</template>

<script>
export default {
  name: 'LegacySessionProposalModal',
  props: {
    wcData: Object,
    openModal: Boolean,
    requestId: String,
    dappName: String,
    onRequest: Function,
    dappUrl: String
  },
  data: () => ({
    isLoading: false
  }),
}
</script>
