export const normalizeGSTIN = (value: string) => value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);

export const defaultBillingAddress = {
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

export type BillingAddress = typeof defaultBillingAddress;
