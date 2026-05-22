<template>
  <div class='modal' v-if='isOpen' @click='closeModal'>
    <div class='modal-content' @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: ['isOpen'],
  methods: {
    closeModal() {
      this.$emit('close-modal');
    }
  }
}
</script>