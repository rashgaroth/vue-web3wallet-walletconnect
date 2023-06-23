import Vue, { provide } from 'vue'
import App from './App.vue'
import Vuesax from 'vuesax'
import { DefaultApolloClient } from '@vue/apollo-composable'
import './styles/index.css'
import 'vuesax/dist/vuesax.css'
import { apolloClient } from './apollo'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'

library.add(faUserSecret)

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.config.productionTip = false
Vue.use(Vuesax, {
  colors: {
    primary:'#5b3cc4',
    success:'rgb(23, 201, 100)',
    danger:'rgb(242, 19, 93)',
    warning:'rgb(255, 130, 0)',
    dark:'rgb(36, 33, 69)',
    main: '#0B0E16',
    btnMain: '#EA6559',
    textMain: '#6E27D8'
  }
})

new Vue({
  setup() {
    provide(DefaultApolloClient, apolloClient)
  },
  render: h => h(App),
  template: '<App/>',
  el: '#app'
}).$mount('#app')
