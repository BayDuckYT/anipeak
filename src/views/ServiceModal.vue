<template>
  <Modal :isOpen='isOpen' @close-modal='closeModal'>
    <div class='modal-content'>
      <h2>{{ service.name }}</h2>
      <p>{{ service.description }}</p>
      <p>${{ service.price }}</p>
      <button @click='closeModal'>Close</button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../components/Modal.vue';
export default {
  name: 'ServiceModal',
  components: { Modal },
  props: ['service'],
  data() {
    return {
      isOpen: false
    };
  },
  methods: {
    openModal(service) {
      this.service = service;
      this.isOpen = true;
    },
    closeModal() {
      this.isOpen = false;
    }
  }
}
</script>