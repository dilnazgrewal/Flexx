/**
 * Thin typed client for the Flexx FastAPI backend.
 *
 * Works in both React Server Components (catalogue reads, rendered on the
 * server) and the browser (cart, auth, checkout). Auth and cart identity are
 * attached automatically from browser storage when running client-side.
 */

import type {
  AuthResponse,
  Cart,
  Category,
  Faq,
  Order,
  ProductDetail,
  ProductListResponse,
  Review,
  ShippingAddress,
  Testimonial,
  User,
} from "@/lib/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api";

export const AUTH_STORAGE_KEY = "flexx.auth.token";
export const CART_STORAGE_KEY = "flexx.cart.token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) - degrade quietly */
  }
}

export function getAuthToken() {
  return readStorage(AUTH_STORAGE_KEY);
}

export function getCartToken() {
  return readStorage(CART_STORAGE_KEY);
}

type RequestOptions = RequestInit & {
  /** Next.js caching hints, only meaningful on the server. */
  revalidate?: number | false;
  auth?: boolean;
  cartToken?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { revalidate, auth = true, cartToken = true, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  if (init.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (cartToken) {
    const token = getCartToken();
    if (token) finalHeaders.set("X-Cart-Token", token);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: finalHeaders,
      ...(revalidate === undefined
        ? { cache: "no-store" as RequestCache }
        : revalidate === false
          ? { cache: "no-store" as RequestCache }
          : { next: { revalidate } }),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the Flexx API. Make sure the backend is running on port 8000.",
      0,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail =
      (data && typeof data.detail === "string" && data.detail) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status);
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export type ProductQuery = {
  category?: string;
  search?: string;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "rating" | "newest" | "name";
  page?: number;
  pageSize?: number;
};

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return request<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`, {
    revalidate: 30,
    auth: false,
    cartToken: false,
  });
}

export function getProduct(slug: string) {
  return request<ProductDetail>(`/products/${slug}`, {
    revalidate: 30,
    auth: false,
    cartToken: false,
  });
}

export function getRelatedProducts(slug: string) {
  return request<ProductListResponse["items"]>(`/products/${slug}/related`, {
    revalidate: 60,
    auth: false,
    cartToken: false,
  });
}

export function getCategories() {
  return request<Category[]>("/categories", {
    revalidate: 300,
    auth: false,
    cartToken: false,
  });
}

export function getTestimonials() {
  return request<Testimonial[]>("/testimonials", {
    revalidate: 300,
    auth: false,
    cartToken: false,
  });
}

export function getFaqs() {
  return request<Faq[]>("/faqs", { revalidate: 300, auth: false, cartToken: false });
}

export function createReview(
  slug: string,
  payload: { rating: number; title?: string; body?: string; authorName?: string },
) {
  return request<Review>(`/products/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

export function fetchCart() {
  return request<Cart>("/cart");
}

export function addCartItem(slug: string, quantity = 1) {
  return request<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ slug, quantity }),
  });
}

export function updateCartItem(itemId: number, quantity: number) {
  return request<Cart>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(itemId: number) {
  return request<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
}

export function clearCart() {
  return request<Cart>("/cart", { method: "DELETE" });
}

export function applyCoupon(code: string) {
  return request<Cart>("/cart/coupon", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function removeCoupon() {
  return request<Cart>("/cart/coupon", { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export function register(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe() {
  return request<User>("/auth/me");
}

export function updateProfile(payload: { fullName?: string; phone?: string }) {
  return request<User>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export function checkout(payload: {
  email: string;
  shippingAddress: ShippingAddress;
  paymentMethod: "card" | "cod" | "upi";
  notes?: string;
  saveAddress?: boolean;
}) {
  return request<Order>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyOrders() {
  return request<Order[]>("/orders");
}

export function getOrder(orderNumber: string) {
  return request<Order>(`/orders/${orderNumber}`);
}

export function trackOrder(payload: { orderNumber: string; email: string }) {
  return request<Order>("/orders/track", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export function cancelOrder(orderNumber: string) {
  return request<Order>(`/orders/${orderNumber}/cancel`, { method: "POST" });
}

export function subscribeNewsletter(email: string) {
  return request<{ message: string }>("/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
    cartToken: false,
  });
}
