<template lang="pug">
q-dialog#dialog-message(v-model='openDialog' :persistent="persistent" transition-show="rotate" transition-hide="jump-down")
    q-card#card-result.full-width.shadow-12
      q-card-section
        .text-h5.text-center.text-weight-bold {{ title }}
      q-card-section
        .row.q-col-gutter-md.q-pb-lg.text-center
          .col-12
            .text-body1.text-grey-7.q-pb-sm {{ description }}
        div
          q-btn.full-width.q-py-md(
            unelevated
            rounded
            color="primary"
            label="OK"
            v-close-popup
          )
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DialogMessageProps {
  openDialogMessage?: boolean;
  title?: string;
  description?: string;
  persistent?: boolean;
}
const props = withDefaults(defineProps<DialogMessageProps>(), {
  openDialogMessage: false,
  title: '',
  description: '',
  persistent: false
})

const emit = defineEmits(['update:openDialogMessage'])

const openDialog = computed({
  get () {
    return props.openDialogMessage
  },
  set (value) {
    emit('update:openDialogMessage', value)
  }
})
</script>

<style lang="sass">
#dialog-message
  .q-dialog__inner
    @media (max-width: $breakpoint-sm-max)
      padding: 0.5rem
#card-result
  border-radius: 1rem
  background: rgba(255, 255, 255, 0.9)
  backdrop-filter: blur(1rem)
  padding: 2rem
  max-width: 30rem
  @media (max-width: $breakpoint-xs-max)
    padding: 0.7rem
</style>
