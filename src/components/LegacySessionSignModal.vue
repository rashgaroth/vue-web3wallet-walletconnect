<template>
  <div class="hello">
    <!-- eslint-disable-next-line vue/no-mutating-props -->
    <vs-dialog v-model="openModal" not-padding>
      <div class="flex flex-col bg-gray-900 p-5 rounded-xl space-y-5">
        <h4 class="text-gray-200 ml-2">
          <strong class="text-text-main">Personal Sign Data</strong>
        </h4>
        <p class="ml-2 text-gray-200">Request data</p>
        <div class="p-2 mx-2 rounded-lg bg-gray-300 flex flex-col space-y-1">
          <code> id: {{ requestId }} </code>
          <code> dapp name: {{ dappName }} </code>
          <code> request id: {{ requestId }} </code>
          <code> method: {{ method }} </code>
        </div>
        <p class="ml-2 text-gray-200">Sign data</p>
        <div
          class="p-2 mx-2 rounded-lg bg-gray-300 flex flex-col space-y-1 max-h-28 overflow-y-scroll max-w-md"
        >
          <code>
            {{ signData }}
          </code>
        </div>
        <div class="footer-dialog flex flex-row items-center">
          <vs-button
            block
            color="#6E27D8"
            @click="onRequest('approve')"
            :loading="buttonLoading"
          >
            Sign
          </vs-button>
          <vs-button
            block
            danger
            state="danger"
            @click="onRequest('reject')"
            :disabled="buttonLoading"
          >
            Reject
          </vs-button>
        </div>
      </div>
    </vs-dialog>
  </div>
</template>

<script>
export default {
  name: 'LegacySessionSignTypedDataModal',
  props: {
    wcData: Object,
    openModal: Boolean,
    requestId: String,
    dappName: String,
    method: String,
    signData: String,
    buttonLoading: Boolean,
    onRequest: {},
  },
  data: () => ({
    isLoading: false,
  }),
};
</script>
