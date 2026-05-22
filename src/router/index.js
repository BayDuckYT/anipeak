import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/views/Home.vue';
import ServiceModal from '@/views/ServiceModal.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      children: [
        {
          path: 'service/:id',
          name: 'ServiceModal',
          component: ServiceModal
        }
      ]
    }
  ]
});