import Vue from "vue";
import VuexPersistence from "vuex-persist";
import Vuex from "vuex";
import { storageAvailable } from "@/utils/core";
import home from "./mutations/home";


/** @type {VuexPersistence} */
let vuexPersist;

Vue.use(Vuex)

if (storageAvailable('localStorage')) {
  vuexPersist = new VuexPersistence({
    key: 'airdropped',
    storage: window.localStorage,
    reducer: (state) => ({
      home: state.home
    })
  })
}

const defaultState = {
  wcModal: {
    open: false,
    data: {
      proposal: '',
      requestEvent: '',
      requestSession: {},
      legacyProposal: {
        id: 0,
        params: [{ chainId: 0, peerId: '', peerMeta: {} }]
      },
      legacyCallRequestEvent: { id: 0, method: '', params: [] },
      legacyRequestSession: {}
    }
  }
}

const VuexStore = new Vuex.Store({
  plugins: vuexPersist ? [vuexPersist] : [],
  state: defaultState,
  mutations: home
})

export default VuexStore