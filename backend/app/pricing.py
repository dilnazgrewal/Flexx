"""Single source of truth for cart/order money maths.

Both the cart endpoint and checkout use this so the number the customer sees
in the cart is exactly the number they are charged.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Cart, Coupon


def money(value: float) -> float:
    return round(value + 1e-9, 2)


@dataclass(slots=True)
class Totals:
    subtotal: float
    discount: float
    shipping: float
    tax: float
    total: float
    item_count: int
    coupon_code: str | None
    coupon_message: str | None


def lookup_coupon(db: Session, code: str | None) -> Coupon | None:
    if not code:
        return None
    return db.scalar(
        select(Coupon).where(Coupon.code == code.strip().upper(), Coupon.is_active.is_(True))
    )


def compute_totals(db: Session, cart: Cart) -> Totals:
    subtotal = 0.0
    item_count = 0
    for item in cart.items:
        subtotal += item.product.price * item.quantity
        item_count += item.quantity
    subtotal = money(subtotal)

    discount = 0.0
    coupon_message: str | None = None
    coupon_code: str | None = None

    coupon = lookup_coupon(db, cart.coupon_code)
    if cart.coupon_code and coupon is None:
        coupon_message = f"Coupon {cart.coupon_code} is no longer valid."
    elif coupon is not None:
        if subtotal < coupon.min_subtotal:
            coupon_message = (
                f"Spend ${coupon.min_subtotal:.2f} or more to use {coupon.code}."
            )
        else:
            coupon_code = coupon.code
            if coupon.discount_type == "percent":
                discount = money(subtotal * coupon.value / 100)
            else:
                discount = money(min(coupon.value, subtotal))
            coupon_message = coupon.description or f"{coupon.code} applied."

    taxable = max(subtotal - discount, 0.0)
    shipping = (
        0.0
        if taxable == 0 or taxable >= settings.free_shipping_threshold
        else settings.shipping_flat_rate
    )
    tax = money(taxable * settings.tax_rate)
    total = money(taxable + shipping + tax)

    return Totals(
        subtotal=subtotal,
        discount=money(discount),
        shipping=money(shipping),
        tax=tax,
        total=total,
        item_count=item_count,
        coupon_code=coupon_code,
        coupon_message=coupon_message,
    )


def free_shipping_remaining(subtotal: float, discount: float) -> float:
    taxable = max(subtotal - discount, 0.0)
    if taxable == 0:
        return settings.free_shipping_threshold
    return money(max(settings.free_shipping_threshold - taxable, 0.0))
