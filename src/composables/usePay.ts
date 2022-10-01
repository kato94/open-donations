import axios from 'axios'

interface CheckoutData {
  amount: string;
  paymentMethodNonce: string;
  deviceData: string;
  name: string;
  email: string;
}

const usePay = () => {
  const getClientToken = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/pay/client-token`)
      return {
        success: true,
        data: <string>response.data
      }
    } catch (error) {
      return {
        success: false,
        data: ''
      }
    }
  }

  const checkout = async (checkoutData: CheckoutData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/pay/checkout`, checkoutData)
      return {
        success: response.data.success,
        data: <string>response.data
      }
    } catch (error) {
      return {
        success: false,
        data: ''
      }
    }
  }

  return {
    getClientToken,
    checkout
  }
}

export default usePay
