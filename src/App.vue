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
          wcData.openModal && wcData.modalType === 'SessionProposalModal'
        "
        :wcData="wcData"
        :requestId="wcData?.data?.legacyProposal?.id?.toString() || '0'"
        :dappName="getLegacyProposalDappName()"
        :onRequest="onLegacySessionProposalRequest"
        :dappUrl="getLegacyProposalUrl()"
      />
      <LegacySessionSignModal
        :openModal="
          wcData.openModal && wcData.modalType === 'SessionSignModal'
        "
        :wcData="wcData"
        :requestId="getLegacySessionPersonalSignRequestId().toString()"
        :dappName="getLegacyProposalDappName()"
        :method="wcData?.data?.legacyCallRequestEvent?.params?.request?.method || 'Unknown'"
        :signData="
          wcData?.data?.legacyCallRequestEvent?.params?.request?.params[0] || 'Unknown'
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
import LegacySessionSignModal from './components/LegacySessionSignModal.vue';
import { createSignClient, createWeb3WalletV2, pair, signClient, web3Wallet } from './utils/wc';
import constants from './common/contants';
import { getSdkError } from '@walletconnect/utils';
import { personalSign } from './gql/mutations';
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';

export default {
  name: 'App',
  components: {
    DisconnectedView,
    ConnectedView,
    LegacySessionProposalModal,
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
    wcVersion: 2,
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
        walletConnectController.setupEventManagerHandler(val, this.wcVersion);
        // walletConnectController.createSignLegacyClient();
        this.walletConnectController = walletConnectController;
        if (web3Wallet) {
          if (this.wcData.data.legacyProposal.id !== 0) {
            localStorage.setItem('currentTopic', JSON.stringify(this.wcData.data.legacyProposal))
          }
          const activeSessions = web3Wallet.getActiveSessions()
          console.log({
            ...this.wcData.data.legacyProposal,
            activeSessions
          })
        }
      }
    },
  },
  async mounted() {
    const tmpSelectedAddress = localStorage.getItem('selectedAddress');
    if (tmpSelectedAddress) {
      this.walletAddress = tmpSelectedAddress;
      this.isConnected = true;
      console.log(`@-> preparingSignClient...`);
      if (this.wcVersion === 2) {
        await createWeb3WalletV2();
      } else {
        await createSignClient();
      }
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
      console.log(`onSignalListenerHandler`, { data, type })
      if (type === 'SessionProposalModal') {
        this.wcData.modalType = type;
        this.wcData.data.legacyProposal = data.proposal;
        this.wcData.openModal = true;
      } else {
        this.wcData.modalType = type;
        this.wcData.data = {
          ...this.wcData.data,
          legacyCallRequestEvent: data.requestEvent,
        };
        this.wcData.openModal = true;
      }
    },
    getLegacySessionPersonalSignRequestId() {
      console.log('this.wcData', {
        ...this.wcData.data
      });
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
      return 'GuildXYZ';
    },
    getLegacyProposalUrl() {
      if (!this.wcData) {
        return 'Unknown';
      }
      if (this.wcData?.data?.legacyProposal?.verifyContext?.verified?.origin) {
        return this.wcData?.data?.legacyProposal?.verifyContext?.verified?.origin;
      }
      return 'Unknown';
    },
    async onConnect(address) {
      this.walletAddress = address;
      this.isConnected = true;
      try {
        if (this.wcVersion === 2) {
          await createWeb3WalletV2();
        } else {
          await createSignClient();
        }
        this.wcInitialized = true;
      } catch (error) {
        console.warn(error);
        this.wcInitialized = false;
      }
    },
    async wssConnectionHandler(version = 1, uri) {
      console.log(`onWssConnectionHandler`, { version, uri })
      if (!this.walletConnectController) {
        console.error(`WalletConnectController is not initialized`);
        return;
      }
      console.log(`@-> Connecting ... ->`, version, uri);
      if (version === 1) {
        this.walletConnectController.createSignLegacyClient({ uri });
      } else {
        await pair({ uri })
      }
    },
    async onLegacySessionProposalRequest(type) {
      if (type === constants.legacySessionProposalType.APPROVE && this.wcVersion === 1) {
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
      } else if (type === constants.legacySessionProposalType.APPROVE && this.wcVersion === 2) {
        const id = this.wcData.data.legacyProposal.id
        const requiredNamespaces = this.wcData.data.legacyProposal?.params?.requiredNamespaces
        let namespaces = {}
        Object.keys(requiredNamespaces).forEach(key => {
          const accounts = []
          requiredNamespaces[key].chains?.map(chain => {
            [this.walletAddress].map(acc => accounts.push(`${chain}:${acc}`))
          })
          namespaces[key] = {
            accounts,
            methods: requiredNamespaces[key].methods,
            events: requiredNamespaces[key].events
          }
        })

        await web3Wallet.approveSession({
          id,
          relayProtocol: this.wcData.data.legacyProposal.params.relays[0].protocol,
          namespaces
        })
        this.walletConnectController.setupEventManagerHandler(true);
        this.wcData.modalType = '';
        this.wcData.openModal = false;
        this.dappConnected = true;
        this.openNotification('top-left', 'success', {
          title: 'Connected!',
          text: `You're just connected with dapp!`,
        });
      } else {
        this.openNotification('top-left', 'danger', {
          title: 'Rejected',
          text: 'User Reject the request',
        });
        if (this.wcVersion === 1) {
          this.walletConnectController.legacySignClient.rejectSession(
            getSdkError('USER_REJECTED_METHODS')
          );
        } else {
          const id = this.wcData.data.legacyProposal.id
          web3Wallet.rejectSession({
            id,
            reason: getSdkError('USER_REJECTED_EVENTS')
          });
        }
        this.wcData.modalType = '';
        this.wcData.openModal = false;
      }
    },
    async disconnectWalletStreet() {
      localStorage.removeItem('selectedAddress');
      window.location.reload();
    },
    async disconnect() {
      this.walletConnectController.deleteCachedLegacySession(this.wcVersion);
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
        let data = null;
        let getSignature = () => {};

        if (this.wcData.modalType === 'SessionSignModal') {
          data = this.wcData?.data?.legacyCallRequestEvent?.params?.request?.params?.[0];
          const hexMessage = data;
          const email = localStorage.getItem('email');
          getSignature = async () => {
            return personalSign({
              hexMessage,
              email,
            });
          };
        }

        if (!data) {
          if (this.wcVersion === 2) {
            const id = this.wcData.data.legacyProposal.id
            await web3Wallet.rejectSession({ id, reason: getSdkError('USER_REJECTED_EVENTS') })
          } else {
            const reqId = this.wcData.data.legacyCallRequestEvent.id;
            this.walletConnectController.legacySignClient.rejectRequest({
              id: reqId,
              error: 'Data is not valid',
            });
          }
        }

        try {
          this.loading = true;
          const signature = await getSignature();
          if (signature?.data?.res) {
            this.loading = false;
            if (this.wcVersion === 1) {
              const reqId = this.wcData.data.legacyCallRequestEvent.id;
              this.walletConnectController.legacySignClient.approveRequest({
                id: reqId,
                result: signature.data.res,
              });
            } else {
              const reqId = this.wcData.data.legacyCallRequestEvent.id;
              const res = formatJsonRpcResult(reqId, signature?.data?.res)
              await web3Wallet.respondSessionRequest({
                topic: this.wcData.data.legacyCallRequestEvent.topic,
                response: res
              })
            }
            this.wcData.modalType = '';
            this.wcData.openModal = false;
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
          if (this.wcVersion === 1) {
            this.walletConnectController.legacySignClient.rejectRequest({
              id: reqId,
              error: 'User Rejected Request',
            });
          } else {
            await web3Wallet.respondSessionRequest({
              topic: this.wcData.data.legacyCallRequestEvent.topic,
              response: formatJsonRpcError(reqId, getSdkError('USER_REJECTED_EVENTS'))
            })
          }
          this.wcData.modalType = '';
          this.wcData.openModal = false;
          this.wcData.data.legacyCallRequestEvent = {
            id: 0,
            method: '',
            params: [],
          };
        }
      } else {
        if (this.wcVersion === 2) {
          const id = this.wcData.data.legacyProposal.id
          await web3Wallet.rejectSession({ id, reason: getSdkError('USER_REJECTED_EVENTS') })
        } else {
          const reqId = this.wcData.data.legacyCallRequestEvent.id;
          this.walletConnectController.legacySignClient.rejectRequest({
            id: reqId,
            error: 'User Rejected Request',
          });
        }
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
