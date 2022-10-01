
export const rules = {
  required: (v: string) => {
    return !!v || 'Field is required'
  },
  amountMin: (v: string) => {
    const value = parseFloat(v)
    return value >= 1 || 'Minimum $1'
  }
}

export default rules
