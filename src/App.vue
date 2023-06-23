<template>
  <div id="app" class="bg-main min-h-screen p-10">
    <div class="flex flex-col space-y-5 items-center">
      <div class="w-full flex flex-row items-center justify-center">
        <img alt="Vue logo" src="./assets/logos/airdroplogo.png" class="" />
      </div>
      <div v-if="!isConnected">
        <DisconnectedView :onConnected="onConnect" />
      </div>
      <div v-else>
        <ConnectedView
          :address="walletAddress"
          :onWssConnected="wssConnectionHandler"
          :dappConnected="dappConnected"
          :onWalletConnectDisconnectRequest="disconnect"
          :onDisconnect="disconnectWalletStreet"
        />
      </div>
      <LegacySessionProposalModal
        :openModal="
          wcData.openModal && wcData.modalType === 'LegacySessionProposalModal'
        "
        :wcData="wcData"
        :requestId="wcData?.data?.legacyProposal?.id?.toString() || '0'"
        :dappName="getLegacyProposalDappName()"
        :onRequest="onLegacySessionProposalRequest"
        :dappUrl="getLegacyProposalUrl()"
      />
      <LegacySessionSignTypedDataModal
        :openModal="
          wcData.openModal &&
          wcData.modalType === 'LegacySessionSignTypedDataModal'
        "
        :wcData="wcData"
        :requestId="getLegacySessionSignTypedDataRequestId().toString()"
        :dappName="connectionData?.peerMeta?.name || 'Unknown'"
        :method="wcData?.data?.legacyCallRequestEvent?.method || 'Unknown'"
        :signData="
          wcData?.data?.legacyCallRequestEvent?.params?.[1] || 'Unknown'
        "
        :buttonLoading="loading"
        :onRequest="onRequest"
      />
      <LegacySessionSignModal
        :openModal="
          wcData.openModal && wcData.modalType === 'LegacySessionSignModal'
        "
        :wcData="wcData"
        :requestId="getLegacySessionPersonalSignRequestId().toString()"
        :dappName="connectionData?.peerMeta?.name || 'Unknown'"
        :method="wcData?.data?.legacyCallRequestEvent?.method || 'Unknown'"
        :signData="
          wcData?.data?.legacyCallRequestEvent?.params?.[0] || 'Unknown'
        "
        :buttonLoading="loading"
        :onRequest="onRequest"
      />
    </div>
  </div>
</template>

<script>
import ConnectedView from './components/ConnectedView.vue';
import DisconnectedView from './components/DisconnectedView.vue';
import WalletConnectController from './controllers/WalletConnectController';
import LegacySessionProposalModal from './components/LegacySessionProposalModal.vue';
import LegacySessionSignTypedDataModal from './components/LegacySessionSignTypedDataModal.vue';
import LegacySessionSignModal from './components/LegacySessionSignModal.vue';
import { createSignClient, signClient } from './utils/wc';
import constants from './common/contants';
import { getSdkError } from '@walletconnect/utils';
import { personalSign, signTypedData } from './gql/mutations';

export default {
  name: 'App',
  components: {
    DisconnectedView,
    ConnectedView,
    LegacySessionProposalModal,
    LegacySessionSignTypedDataModal,
    LegacySessionSignModal,
  },
  data: () => ({
    isConnected: false,
    walletAddress: null,
    wcInitialized: false,
    connectionData: {},
    wcData: {
      openModal: false,
      data: {
        proposal: '',
        requestEvent: '',
        requestSession: {},
        legacyProposal: {
          id: 0,
          params: [{ chainId: 0, peerId: '', peerMeta: {} }],
        },
        legacyCallRequestEvent: { id: 0, method: '', params: [] },
        legacyRequestSession: {},
      },
      modalType: '',
    },
    loadingModal: true,
    /**
     * @type {WalletConnectController}
     */
    walletConnectController: null,
    loading: false,
    dappConnected: false,
  }),
  watch: {
    wcInitialized: async function (val) {
      if (val) {
        const walletConnectController = new WalletConnectController({
          onSignal: (type, data) => this.signalListenerHandler(type, data),
          onConnected: (data) => {
            if (Object.keys(data).length > 0) {
              this.connectionData = data;
            }
            this.dappConnected = true;
          },
          onDisconnected: () => {
            this.dappConnected = false;
          },
        });
        console.log('@-> setup event manager');
        walletConnectController.setupEventManagerHandler(val);
        walletConnectController.createSignLegacyClient();
        this.walletConnectController = walletConnectController;
      }
    },
  },
  async mounted() {
    const tmpSelectedAddress = localStorage.getItem('selectedAddress');
    if (tmpSelectedAddress) {
      this.walletAddress = tmpSelectedAddress;
      this.isConnected = true;
      console.log(`@-> preparingSignClient...`);
      await createSignClient();
      this.wcInitialized = true;
    }

    if (
      signClient &&
      signClient?.session &&
      signClient.session.values.length === 0
    ) {
      this.dappConnected = false;
    }
  },
  methods: {
    signalListenerHandler(type, data) {
      if (type === 'LegacySessionSignTypedDataModal') {
        this.wcData.modalType = type;
        this.wcData.data = {
          ...this.wcData.data,
          legacyCallRequestEvent: data.legacyCallRequestEvent,
        };
        this.wcData.openModal = true;
      } else {
        this.wcData.modalType = type;
        this.wcData.data = {
          ...this.wcData.data,
          legacyProposal: data.legacyProposal,
          legacyCallRequestEvent: data.legacyCallRequestEvent,
        };
        this.wcData.openModal = true;
      }
    },
    getLegacySessionPersonalSignRequestId() {
      console.log('this.wcData', this.wcData);
      if (!this.wcData) {
        return 'Unknown';
      }
      const id = this.wcData?.data?.legacyCallRequestEvent?.id;
      if (id || typeof id === 'number') {
        return this.wcData?.data?.legacyCallRequestEvent?.id;
      }
      return 'Unknown';
    },
    getLegacySessionSignTypedDataRequestId() {
      if (!this.wcData) {
        return 'Unknown';
      }
      if (this.wcData?.data?.legacyCallRequestEvent?.id) {
        return this.wcData?.data?.legacyCallRequestEvent?.id;
      }
      return 'Unknown';
    },
    getLegacyProposalDappName() {
      if (!this.wcData) {
        return 'Unknown';
      }
      if (this.wcData?.data?.legacyProposal?.params[0]?.peerMeta?.name) {
        return this.wcData?.data?.legacyProposal?.params[0]?.peerMeta?.name;
      }
      return 'Unknown Dapp';
    },
    getLegacyProposalUrl() {
      if (!this.wcData) {
        return 'Unknown';
      }
      if (this.wcData?.data?.legacyProposal?.params[0]?.peerMeta?.url) {
        return this.wcData?.data?.legacyProposal?.params[0]?.peerMeta?.url;
      }
      return 'Unknown';
    },
    async onConnect(address) {
      this.walletAddress = address;
      this.isConnected = true;
      try {
        await createSignClient();
        this.wcInitialized = true;
      } catch (error) {
        console.warn(error);
        this.wcInitialized = false;
      }
    },
    async wssConnectionHandler(version = 1, uri) {
      if (!this.walletConnectController) {
        console.error(`WalletConnectController is not initialized`);
        return;
      }
      console.log(`@-> Connecting ... ->`, version, uri);
      if (version === 1) {
        this.walletConnectController.createSignLegacyClient({ uri });
      } else {
        signClient.pair({ uri });
      }
    },
    onLegacySessionProposalRequest(type) {
      if (type === constants.legacySessionProposalType.APPROVE) {
        console.info(`@-> Connecting with address: ${this.walletAddress}`);
        this.walletConnectController.legacySignClient.approveSession({
          accounts: [this.walletAddress],
          chainId: 80001,
        });
        this.wcData.modalType = '';
        this.wcData.openModal = false;
        this.dappConnected = true;
        this.walletConnectController.setupEventManagerHandler(true);
        this.openNotification('top-left', 'success', {
          title: 'Connected!',
          text: `You're just connected with dapp!`,
        });
      } else {
        this.openNotification('top-left', 'danger', {
          title: 'Rejected',
          text: 'User Reject the request',
        });
        this.walletConnectController.legacySignClient.rejectSession(
          getSdkError('USER_REJECTED_METHODS')
        );
        this.wcData.modalType = '';
        this.wcData.openModal = false;
      }
    },
    async disconnectWalletStreet() {
      localStorage.removeItem('selectedAddress');
      window.location.reload();
    },
    async disconnect() {
      this.walletConnectController.deleteCachedLegacySession();
      this.dappConnected = false;
    },
    openNotification(
      position = null,
      color,
      { title = 'info', text = 'nothing' }
    ) {
      this.$vs.notification({
        color,
        position,
        title,
        text,
      });
    },
    async onRequest(result) {
      if (result === constants.legacySessionProposalType.APPROVE) {
        const reqId = this.wcData.data.legacyCallRequestEvent.id;
        const data = this.wcData.data.legacyCallRequestEvent.params[1];
        if (!data) {
          this.walletConnectController.legacySignClient.rejectRequest({
            id: reqId,
            error: 'Data is not valid',
          });
        }

        let getSignature = () => {};
        if (this.wcData.modalType === 'LegacySessionSignTypedDataModal') {
          const jsonData = JSON.parse(data);
          const { types, domain, message } = jsonData;
          const email = localStorage.getItem('email');
          delete types.EIP712Domain;

          getSignature = async () => {
            return signTypedData({
              domain,
              email,
              message,
              types,
            });
          };
        } else if (this.wcData.modalType === 'LegacySessionSignModal') {
          const hexMessage = data;
          const email = localStorage.getItem('email');
          getSignature = async () => {
            return personalSign({
              hexMessage,
              email,
            });
          };
        }

        try {
          this.loading = true;
          const signature = await getSignature();
          if (signature?.data?.res) {
            this.loading = false;
            this.walletConnectController.legacySignClient.approveRequest({
              id: reqId,
              result: signature.data.res,
            });
            this.wcData.modalType = '';
            this.wcData.openModal = false;
            this.wcData.data.legacyCallRequestEvent = {
              id: 0,
              method: '',
              params: [],
            };
          }
        } catch (error) {
          this.openNotification('top-left', 'danger', {
            title: 'Error',
            text:
              'Transaction rejected with error: ' + error.message ||
              'Unknown error',
          });
          this.loading = false;
          const reqId = this.wcData.data.legacyCallRequestEvent.id;
          this.walletConnectController.legacySignClient.rejectRequest({
            id: reqId,
            error: 'User Rejected Request',
          });
          this.wcData.modalType = '';
          this.wcData.openModal = false;
          this.wcData.data.legacyCallRequestEvent = {
            id: 0,
            method: '',
            params: [],
          };
        }
      } else {
        const reqId = this.wcData.data.legacyCallRequestEvent.id;
        this.walletConnectController.legacySignClient.rejectRequest({
          id: reqId,
          error: 'User Rejected Request',
        });
        this.openNotification('top-left', 'danger', {
          title: 'Rejected',
          text: 'User Reject the request',
        });
        this.wcData.modalType = '';
        this.wcData.openModal = false;
        this.wcData.data.legacyCallRequestEvent = {
          id: 0,
          method: '',
          params: [],
        };
      }
    },
  },
};
</script>
