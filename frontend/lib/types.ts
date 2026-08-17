export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "SOLD_OUT";

export type ProductCondition = "NEW_WITH_TAGS" | "EXCELLENT" | "GOOD" | "FAIR";

export type SizeGroup = "APPAREL" | "WAIST" | "FOOTWEAR" | "ONE_SIZE";

export type ProductSummary = {
  id: string;
  title: string;
  brand: string;
  sizeLabel: string;
  pricePesewas: number;
  categoryName: string;
  primaryImageUrl: string | null;
  primaryThumbUrl: string | null;
  availableQuantity: number;
  status: AvailabilityStatus;
};

export type ProductImage = {
  url: string;
  thumbUrl: string;
  position: number;
};

export type ProductDetail = {
  id: string;
  title: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  brand: string;
  sizeLabel: string;
  condition: ProductCondition;
  colour: string | null;
  era: string | null;
  flaws: string | null;
  sizingNotes: string | null;
  pricePesewas: number;
  availableQuantity: number;
  status: AvailabilityStatus;
  images: ProductImage[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sizeGroup: SizeGroup;
};

export type CatalogFilterOptions = {
  categories: Category[];
  brands: string[];
  sizes: string[];
  conditions: ProductCondition[];
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CartLine = {
  productId: string;
  title: string;
  brand: string;
  sizeLabel: string;
  pricePesewas: number;
  primaryImageUrl: string | null;
  primaryThumbUrl: string | null;
  quantity: number;
  expiresAt: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  feePesewas: number;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "PAYSTACK" | "CASH_ON_DELIVERY";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  itemCount: number;
  totalPesewas: number;
  createdAt: string;
};

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  zoneName: string;
  itemCount: number;
  totalPesewas: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

export type OrderItemLine = {
  productTitle: string;
  productSize: string;
  imageUrl: string | null;
  quantity: number;
  pricePesewas: number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryZoneName: string;
  deliveryFeePesewas: number;
  subtotalPesewas: number;
  totalPesewas: number;
  paymentMethod: PaymentMethod | null;
  items: OrderItemLine[];
  createdAt: string;
};

export type CheckoutResponse = {
  order: OrderDetail;
  authorizationUrl: string | null;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  defaultAddress: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type AdminDashboard = {
  totalRevenuePesewas: number;
  orderCount: number;
  itemsSold: number;
  liveStockUnits: number;
  awaitingActionCount: number;
  awaitingAction: AdminOrderSummary[];
};
