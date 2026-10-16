"""Pydantic request/response models.

Response fields are camelCase on the wire (so the Next.js client can consume
them idiomatically) while staying snake_case in Python.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(word.capitalize() for word in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------
class RegisterRequest(ApiModel):
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]
    phone: str | None = None


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class UserOut(ApiModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str | None = None
    is_admin: bool
    created_at: datetime


class TokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateProfileRequest(ApiModel):
    full_name: Annotated[str | None, Field(min_length=2, max_length=120)] = None
    phone: str | None = None


class ChangePasswordRequest(ApiModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=8, max_length=128)]


# --------------------------------------------------------------------------
# Catalogue
# --------------------------------------------------------------------------
class CategoryOut(ApiModel):
    id: int
    slug: str
    name: str
    description: str
    image: str
    image_position: str | None = None
    product_count: int = 0


class ProductSummary(ApiModel):
    id: int
    slug: str
    name: str
    flavor: str
    short_description: str
    price: float
    original_price: float | None = None
    discount_percent: int | None = None
    protein_per_serving: int
    color: str
    image: str
    hover_image: str
    rating: float
    review_count: int
    review_count_label: str
    stock: int
    in_stock: bool
    tag: str | None = None
    is_featured: bool
    category_slug: str | None = None
    category_name: str | None = None


class ReviewOut(ApiModel):
    id: int
    author_name: str
    rating: int
    title: str
    body: str
    is_verified: bool
    created_at: datetime


class ProductDetail(ProductSummary):
    description: str
    calories: int | None = None
    servings: int | None = None
    weight_grams: int | None = None
    ingredients: str
    gallery: list[str] = []
    reviews: list[ReviewOut] = []


class ProductListResponse(ApiModel):
    items: list[ProductSummary]
    total: int
    page: int
    page_size: int
    pages: int


class ReviewCreate(ApiModel):
    rating: Annotated[int, Field(ge=1, le=5)]
    title: Annotated[str, Field(max_length=160)] = ""
    body: Annotated[str, Field(max_length=2000)] = ""
    author_name: Annotated[str | None, Field(min_length=2, max_length=120)] = None


# --------------------------------------------------------------------------
# Cart
# --------------------------------------------------------------------------
class CartItemOut(ApiModel):
    id: int
    product_id: int
    slug: str
    name: str
    flavor: str
    image: str
    unit_price: float
    original_price: float | None = None
    quantity: int
    line_total: float
    stock: int
    in_stock: bool


class CartTotals(ApiModel):
    subtotal: float
    discount: float
    shipping: float
    tax: float
    total: float
    item_count: int
    free_shipping_threshold: float
    free_shipping_remaining: float


class CartOut(ApiModel):
    token: str
    items: list[CartItemOut]
    totals: CartTotals
    coupon_code: str | None = None
    coupon_message: str | None = None


class AddToCartRequest(ApiModel):
    product_id: int | None = None
    slug: str | None = None
    quantity: Annotated[int, Field(ge=1, le=99)] = 1

    @field_validator("slug")
    @classmethod
    def _require_identifier(cls, value: str | None, info):
        if not value and not info.data.get("product_id"):
            raise ValueError("Provide either productId or slug")
        return value


class UpdateCartItemRequest(ApiModel):
    quantity: Annotated[int, Field(ge=0, le=99)]


class ApplyCouponRequest(ApiModel):
    code: Annotated[str, Field(min_length=2, max_length=40)]


# --------------------------------------------------------------------------
# Orders
# --------------------------------------------------------------------------
class ShippingAddressIn(ApiModel):
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    phone: Annotated[str, Field(min_length=6, max_length=40)]
    line1: Annotated[str, Field(min_length=3, max_length=200)]
    line2: str | None = None
    city: Annotated[str, Field(min_length=2, max_length=100)]
    state: Annotated[str, Field(min_length=2, max_length=100)]
    postal_code: Annotated[str, Field(min_length=3, max_length=20)]
    country: Annotated[str, Field(min_length=2, max_length=80)] = "United States"


class CheckoutRequest(ApiModel):
    email: EmailStr
    shipping_address: ShippingAddressIn
    payment_method: Literal["card", "cod", "upi"] = "card"
    notes: str | None = None
    save_address: bool = False


class OrderItemOut(ApiModel):
    id: int
    product_slug: str
    name: str
    flavor: str
    image: str
    unit_price: float
    quantity: int
    line_total: float


class OrderOut(ApiModel):
    id: int
    order_number: str
    email: EmailStr
    full_name: str
    phone: str
    line1: str
    line2: str | None = None
    city: str
    state: str
    postal_code: str
    country: str
    subtotal: float
    discount: float
    shipping: float
    tax: float
    total: float
    coupon_code: str | None = None
    status: str
    payment_method: str
    payment_status: str
    notes: str | None = None
    created_at: datetime
    items: list[OrderItemOut]

    @field_validator("status", "payment_status", mode="before")
    @classmethod
    def _enum_to_value(cls, value):
        return getattr(value, "value", value)


class OrderTrackRequest(ApiModel):
    order_number: Annotated[str, Field(min_length=4, max_length=32)]
    email: EmailStr


class OrderStatusUpdate(ApiModel):
    status: Literal[
        "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"
    ]


# --------------------------------------------------------------------------
# Content
# --------------------------------------------------------------------------
class TestimonialOut(ApiModel):
    id: int
    name: str
    role: str
    product: str
    review: str
    rating: int


class FaqOut(ApiModel):
    id: int
    question: str
    answer: str


class NewsletterRequest(ApiModel):
    email: EmailStr


class MessageResponse(ApiModel):
    message: str
