<template>
  <div class='home'>
    <header>
      <h1>Welcome to ANIPEAK STUDIO</h1>
    </header>
    <main>
      <ServiceCard v-for='service in services' :key='service._id' :service='service' @open-modal='openModal'/>
    </main>
  </div>
</template>

<script>
import ServiceCard from '../components/ServiceCard.vue';
export default {
  name: 'Home',
  components: { ServiceCard },
  data() {
    return {
      services: []
    };
  },
  methods: {
    openModal(service) {
      this.$refs.modal.openModal({ service });
    }
  },
  created() {
    // Fetch services from API
    fetch('/api/services')
      .then(response => response.json())
      .then(data => {
        this.services = data;
      })
      .catch(error => {
        console.error('Error fetching services:', error);
      });
  }
}
</script>