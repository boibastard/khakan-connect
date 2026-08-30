export type KhakanOrderItem = {
  name: string;
  sku: string | null;
  quantity: number;
};

export type KhakanShippingAddress = {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  provinceCode: string | null;
  zip: string | null;
  countryCode: string | null;
  phone: string | null;
};

export type KhakanOrder = {
  sourceOrderId: string;
  sourceOrderNumber: string;
  createdAt: string;
  paymentStatus: string;

  shippingAddress: KhakanShippingAddress | null;

  items: KhakanOrderItem[];
};