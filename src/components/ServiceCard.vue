<template>
  <div class='service-card' @click='openModal'>
    <h2>{{ service.name }}</h2>
    <p>{{ service.description }}</p>
    <p>${{ service.price }}</p>
  </div>
</template>

<script>
export default {
  name: 'ServiceCard',
  props: ['service'],
  methods: {
    openModal() {
      this.$emit('open-modal', this.service);
    }
  }
}
</script>