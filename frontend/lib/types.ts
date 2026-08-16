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
