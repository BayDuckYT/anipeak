<template>
  <div class='hover-effect' @mouseover='$emit("mouseenter")' @mouseout='$emit("mouseleave")'>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'HoverEffect'
}
</script>