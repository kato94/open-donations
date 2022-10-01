<template lang="pug">
q-dialog#dialog-info(v-model='openDialog' persistent)
  q-card#card-info.full-width.shadow-12
    q-card-section.text-center
      .text-h5.text-weight-bold.q-mb-sm Payment Information
      .text-body2.text-grey-7.q-mb-sm
        | Donation {{ amount }} dollar(s)
      q-btn.btn-close(icon="close" flat round dense v-close-popup size="lg")
    q-card-section
      q-form(ref="cardForm" @submit="onSubmit")
        .row.q-col-gutter-md.q-pb-lg
          .col-6.column
            .text-subtitle1.text-weight-bold Name
            .text-body2.text-grey-7.q-pb-sm Name of generous person
            q-input.q-mt-auto(
              v-model="card.name"
              outlined
              dense
              :rules="[rules.required]"
              placeholder="Gerson Ruiz"
            )
          .col-6.column
            .text-subtitle1.text-weight-bold E-mail
            .text-body2.text-grey-7.q-pb-sm E-mail to receive confirmation
            q-input.q-mt-auto(
              v-model="card.email"
              outlined
              dense
              :rules="[rules.required, 'email']"
              placeholder="example@gerson-ruiz.com"
            )
          .col-12
            .text-subtitle1.text-weight-bold Card Number
            .text-body2.text-grey-7.q-pb-sm Enter the 16-digit card number on the card
            q-input(
              v-model="card.number"
              outlined
              :mask="maskCard"
              placeholder="4111  -  1111  -  1111  -  1111"
              unmasked-value
              maxlength="34"
              :rules="[rules.required]"
              :error="hasErrorCard"
              @focus="isFocusCard = true"
              @blur="isFocusCard = false"
            )

          .col-6.flex.full-width.items-center
            .grow.column.justify-center
              .text-subtitle1.text-weight-bold Expiry Date (MM / YY)
              .text-body2.text-grey-7 Enter the expiration date of the card
            q-input.expirationDate(
              v-model="card.expirationDate"
              outlined
              mask="## / ##"
              placeholder="MM / YY"
              :rules="[rules.required]"
              :error="hasErrorExpirationDate"
              @focus="isFocusExpirationDate = true"
              @blur="isFocusExpirationDate = false"
            )

          .col-12.flex.full-width
            .grow.column.justify-center
              .text-subtitle1.text-weight-bold CVV Code
              .text-body2.text-grey-7 Enter the 3 or 4-digit code on the back of the card
            q-input.short-number(
              v-model="card.cvv"
              outlined
              mask="####"
              unmasked-value
              placeholder="123"
              :rules="[rules.required]"
              :error="hasErrorCvv"
              @focus="isFocusCvv = true"
              @blur="isFocusCvv = false"
              maxlength="4"
              type="password"
            )
        div
          q-btn.full-width.q-py-md(
            unelevated
            rounded
            color="primary"
            label="PAY NOW"
            type="submit"
            :loading="isLoadingPay"
          )
</template>

<script setup lang="ts">
import { computed, type Ref, ref } from 'vue'
import valid from 'card-validator'
import { Client } from 'braintree-web'
import usePay from 'src/composables/usePay'
import rules from 'src/utils/rules'

interface DialogCardProps {
  clientInstance?: Client
  amount?: string;
  deviceData?: string;
  openDialogCard?: boolean;
}
type CreditCardType = {
    niceType: string;
    type: string;
    patterns: Array<number[] | number>;
    gaps: number[];
    lengths: number[];
    code: {
        name: string;
        size: number;
    };
};
const props = withDefaults(defineProps<DialogCardProps>(), {
  clientInstance: undefined,
  amount: '',
  deviceData: '',
  openDialogCard: false
})

const emit = defineEmits(['update:openDialogCard', 'message'])

const { checkout } = usePay()

const cardForm: Ref<HTMLFormElement | null> = ref(null)

const isFocusCard = ref(true)
const isFocusExpirationDate = ref(true)
const isFocusCvv = ref(true)

const card = ref({
  name: '',
  email: '',
  number: '',
  expirationDate: '',
  cvv: ''
})

const openDialog = computed({
  get () {
    return props.openDialogCard
  },
  set (value) {
    emit('update:openDialogCard', value)
  }
})

const maskCard = ref('####  -  ####  -  ####  -  #######')

const formatCard = (_card: CreditCardType | null) => {
  if (_card && _card.lengths[0] === 15) {
    maskCard.value = '####  -  ######  -  #########'
  } else {
    maskCard.value = '####  -  ####  -  ####  -  #######'
  }
}

const hasErrorCard = computed(() => {
  const { isValid, card: _card } = valid.number(card.value.number)

  formatCard(_card)

  return !(isFocusCard.value || isValid)
})

const hasErrorExpirationDate = computed(() => {
  const { isValid } = valid.expirationDate(card.value.expirationDate)
  return !(isFocusExpirationDate.value || isValid)
})

const hasErrorCvv = computed(() => {
  const { isValid } = valid.cvv(card.value.cvv)
  return !(isFocusCvv.value || isValid)
})

const isLoadingPay = ref(false)

const onSubmit = () => {
  cardForm.value?.validate().then((success: boolean) => {
    if (
      success &&
      !hasErrorCard.value &&
      !hasErrorExpirationDate.value &&
      !hasErrorCvv.value
    ) {
      sendPay()
    }
  })
}

const formatCreditCardData = () => {
  const [month, year] = card.value.expirationDate.split('/')
  const creditCard = {
    number: card.value.number,
    cvv: card.value.cvv,
    expirationDate: `${month?.trim()}/${year?.trim()}`,
    options: {
      validate: false
    }
  }
  return { creditCard }
}

const sendPay = () => {
  isLoadingPay.value = true
  const data = formatCreditCardData()

  props.clientInstance.request({
    endpoint: 'payment_methods/credit_cards',
    method: 'post',
    data
  }, async (err, response) => {
    if (err) {
      emit('message', {
        title: 'Transaction error 😢',
        description: 'Payment server error, please try again later.'
      })
    } else {
      await sendCheckout(String(response.creditCards[0].nonce))
    }
    isLoadingPay.value = false
    openDialog.value = false
  })
}

const sendCheckout = async (nonce: string) => {
  const respCheckout = await checkout({
    amount: props.amount,
    paymentMethodNonce: String(nonce),
    deviceData: props.deviceData,
    name: card.value.name,
    email: card.value.email
  })

  if (respCheckout.success) {
    emit('message', {
      title: 'Successful donation 😄',
      description: 'Thank you for your donation 🎉🎉🎉🎉',
      persistent: true
    })
    onReset()
  } else {
    emit('message', {
      title: 'Transaction error 😢',
      description: 'The transaction could not be completed, please try again later.'
    })
  }
}

const onReset = () => {
  isFocusCard.value = true
  isFocusExpirationDate.value = true
  isFocusCvv.value = true

  card.value = {
    name: '',
    email: '',
    number: '',
    expirationDate: '',
    cvv: ''
  }
}

</script>

<style lang="sass">
#dialog-info
  .q-dialog__inner
    @media (max-width: $breakpoint-sm-max)
      padding: 0.5rem
#card-info
  border-radius: 1rem
  background: rgba(255, 255, 255, 0.9)
  backdrop-filter: blur(1rem)
  padding: 2rem
  max-width: 40rem

  .btn-close
    position: absolute
    top: 0
    right: 0

  .grow
    flex-grow: 1

  .expirationDate
    width: 100%
    max-width: 14rem

  .short-number
    width: 100%
    max-width: 7rem
    input
      text-align: center

  @media (max-width: $breakpoint-xs-max)
    padding: 0.7rem
    .expirationDate
      max-width: 100%

    .short-number
      max-width: 100%
      input
        text-align: left
</style>
