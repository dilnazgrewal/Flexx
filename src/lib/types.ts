/** Shapes returned by the Flexx API (camelCase on the wire). */

export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  imagePosition?: string | null;
  productCount: number;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  flavor: string;
  shortDescription: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  proteinPerServing: number;
  color: string;
  image: string;
  hoverImage: string;
  rating: number;
  reviewCount: number;
  reviewCountLabel: string;
  stock: number;
  inStock: boolean;
  tag?: string | null;
  isFeatured: boolean;
  categorySlug?: string | null;
  categoryName?: string | null;
};

export type Review = {
  id: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
};

export type ProductDetail = Product & {
  description: string;
  calories?: number | null;
  servings?: number | null;
  weightGrams?: number | null;
  ingredients: string;
  gallery: string[];
  reviews: Review[];
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type CartItem = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  flavor: string;
  image: string;
  unitPrice: number;
  originalPrice?: number | null;
  quantity: number;
  lineTotal: number;
  stock: number;
  inStock: boolean;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
};

export type Cart = {
  token: string;
  items: CartItem[];
  totals: CartTotals;
  couponCode?: string | null;
  couponMessage?: string | null;
};

export type User = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  isAdmin: boolean;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: User;
};

export type OrderItem = {
  id: number;
  productSlug: string;
  name: string;
  flavor: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: number;
  orderNumber: string;
  email: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Testimonial = {
  id: number;
  name: string;
  role: string;
  product: string;
  review: string;
  rating: number;
};

export type Faq = {
  id: number;
  question: string;
  answer: string;
};
