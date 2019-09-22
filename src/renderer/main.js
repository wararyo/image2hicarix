import Vue from 'vue'

import App from './App'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Buefy)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')
