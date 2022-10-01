<template lang="pug">
q-page(class="row items-center justify-evenly bg-green-1")

  q-card#card-donate.full-width.transparent.q-px-sm(:flat='true', :bordered='false')
    q-img(:ratio="4/3" src='/img/donate-cover.webp')
      div(class="absolute-center transparent")
        q-avatar.shadow-10(size="15rem")
          img(src="/img/kato.webp")
    q-card-section.text-center
      .text-h4.q-mb-sm Gerson Ruiz
      .text-body2.text-grey.q-mb-sm
        | Donations are welcome to continue improving the projects.
      div
        q-input.q-mx-auto.text-h4.text-weight-medium.q-mb-md.amount(
          :style="`width: ${amountWidth};`"
          ref="amountRef"
          borderless
          v-model="amount"
          mask="#.##"
          fill-mask="0"
          reverse-fill-mask
          prefix="$"
          :rules="[rules.amountMin]"
          no-error-icon
          maxlength="11"
          @update:model-value="updateAmount"
          dense
          bottom-slots
          input-class="text-right"
        )
      div
        q-btn.q-py-md.full-width.btn-donate(
          :loading="isLoadingBtnDonate"
          :disable="!activeBtnDonate"
          unelevated
          rounded
          color="primary"
          label="DONATE"
          @click="openDialogCard = true"
        )

  DialogCard(
    :clientInstance="clientInstance"
    :amount="amount"
    :deviceData="deviceData"
    v-model:openDialogCard="openDialogCard"
    @message="showDialogMessage"
  )

  DialogMessage(
    v-bind="messageResult"
    v-model:openDialogMessage="openDialogMessage"
  )
</template>

<script setup lang="ts">
import { computed, onMounted, type Ref, ref } from 'vue'
import client from 'braintree-web/client'
import dataCollector from 'braintree-web/data-collector'
import usePay from 'src/composables/usePay'
import { Client } from 'braintree-web'
import rules from 'src/utils/rules'
import DialogCard from 'src/components/DialogCard.vue'
import DialogMessage, { type DialogMessageProps } from 'src/components/DialogMessage.vue'

const { getClientToken } = usePay()

const openDialogCard = ref(false)
const openDialogMessage = ref(false)
const hasToken = ref(false)
const amountRef = ref()
const amountWidth = ref('7rem')
const messageResult: Ref<DialogMessageProps> = ref({
  title: '',
  description: '',
  persistent: false
})
const amount = ref('3.00')
const deviceData = ref()

const clientInstance: Ref<Client | undefined> = ref()

const updateAmount = (val: string | number | null) => {
  const lenth = String(val).length
  if (lenth > 4) {
    const width = 7 + ((lenth - 4) * 1.2)
    amountWidth.value = `${width}rem`
  } else {
    amountWidth.value = '7rem'
  }
}

const isLoadingBtnDonate = ref(true)
const activeBtnDonate = computed(() => {
  return hasToken.value && !amountRef.value?.hasError
})

const showDialogMessage = (message: DialogMessageProps) => {
  messageResult.value = message
  openDialogMessage.value = true
}

onMounted(async () => {
  const respClient = await getClientToken()

  if (respClient.success) {
    clientInstance.value = await client.create({
      authorization: respClient.data
    })

    const dataCollectorInstance = await dataCollector.create({
      client: clientInstance.value
    })
    deviceData.value = dataCollectorInstance.deviceData

    hasToken.value = true
  } else {
    showDialogMessage({
      title: 'Error 😢',
      description: 'Server error, please try again later.',
      persistent: true
    })
  }
  isLoadingBtnDonate.value = false
})

</script>

<style lang="sass">
.amount
  .q-field__inner
    .q-field__messages
      text-align: right
      width: 100%
.btn-donate
  max-width: 25rem
#card-donate
  border-radius: 1rem
  max-width: 40rem
  .q-card__section
    border-top-left-radius: 3rem
    border-top-right-radius: 3rem
    top: -3rem
    position: relative
    background-color: #fff
  .q-card__section--vert
    padding: 4rem 1rem
  @media (max-width: $breakpoint-xs-max)
    .q-avatar
      font-size: 10rem !important
</style>
