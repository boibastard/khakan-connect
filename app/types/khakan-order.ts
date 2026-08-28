export type KhakanOrderItem = {
  name: string;
  sku: string | null;
  quantity: number;
};

export type KhakanOrder = {
  sourceOrderId: string;
  sourceOrderNumber: string;
  createdAt: string;
  paymentStatus: string;
  items: KhakanOrderItem[];
};