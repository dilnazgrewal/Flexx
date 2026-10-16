"""Checkout and order management."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import AdminUser, CurrentUser, DbSession, OptionalUser, resolve_cart
from app.models import Address, Order, OrderItem, OrderStatus, PaymentStatus, Product
from app.pricing import compute_totals
from app.schemas import (
    CheckoutRequest,
    OrderOut,
    OrderStatusUpdate,
    OrderTrackRequest,
)
from app.security import new_order_number

router = APIRouter(tags=["orders"])

CartTokenHeader = Annotated[str | None, Header(alias="X-Cart-Token")]


@router.post("/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    db: DbSession,
    user: OptionalUser,
    cart_token: CartTokenHeader = None,
) -> OrderOut:
    cart = resolve_cart(db, cart_token, user, create=False)
    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty."
        )

    # Re-check stock under the same transaction that will decrement it.
    for item in cart.items:
        product = db.get(Product, item.product_id, with_for_update=False)
        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{item.product.name} is no longer available.",
            )
        if item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only {product.stock} left in stock for {product.name}.",
            )

    totals = compute_totals(db, cart)
    address = payload.shipping_address

    order = Order(
        order_number=new_order_number(),
        user_id=user.id if user else None,
        email=payload.email.lower().strip(),
        full_name=address.full_name.strip(),
        phone=address.phone.strip(),
        line1=address.line1.strip(),
        line2=(address.line2 or "").strip() or None,
        city=address.city.strip(),
        state=address.state.strip(),
        postal_code=address.postal_code.strip(),
        country=address.country.strip(),
        subtotal=totals.subtotal,
        discount=totals.discount,
        shipping=totals.shipping,
        tax=totals.tax,
        total=totals.total,
        coupon_code=totals.coupon_code,
        status=OrderStatus.confirmed,
        payment_method=payload.payment_method,
        payment_status=(
            PaymentStatus.unpaid if payload.payment_method == "cod" else PaymentStatus.paid
        ),
        notes=(payload.notes or "").strip() or None,
    )
    db.add(order)
    db.flush()

    for item in cart.items:
        product = item.product
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_slug=product.slug,
                name=product.name,
                flavor=product.flavor,
                image=product.image,
                unit_price=product.price,
                quantity=item.quantity,
                line_total=round(product.price * item.quantity, 2),
            )
        )
        product.stock -= item.quantity

    if user and payload.save_address:
        db.add(
            Address(
                user_id=user.id,
                full_name=order.full_name,
                phone=order.phone,
                line1=order.line1,
                line2=order.line2,
                city=order.city,
                state=order.state,
                postal_code=order.postal_code,
                country=order.country,
            )
        )

    # Empty the cart; the customer starts fresh after a successful order.
    for item in list(cart.items):
        db.delete(item)
    cart.coupon_code = None

    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order)


@router.get("/orders", response_model=list[OrderOut])
def my_orders(user: CurrentUser, db: DbSession) -> list[OrderOut]:
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    ).all()
    return [OrderOut.model_validate(o) for o in orders]


@router.get("/orders/{order_number}", response_model=OrderOut)
def get_order(order_number: str, db: DbSession, user: OptionalUser) -> OrderOut:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == order_number.upper())
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # A guest order is readable by anyone holding the (unguessable) order
    # number; a user-owned order requires that user or an admin.
    if order.user_id is not None and (user is None or (user.id != order.user_id and not user.is_admin)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")

    return OrderOut.model_validate(order)


@router.post("/orders/track", response_model=OrderOut)
def track_order(payload: OrderTrackRequest, db: DbSession) -> OrderOut:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.order_number == payload.order_number.strip().upper(),
            Order.email == payload.email.lower().strip(),
        )
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No order matches that number and email.",
        )
    return OrderOut.model_validate(order)


@router.post("/orders/{order_number}/cancel", response_model=OrderOut)
def cancel_order(order_number: str, db: DbSession, user: CurrentUser) -> OrderOut:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == order_number.upper())
    )
    if not order or (order.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status in (OrderStatus.shipped, OrderStatus.delivered, OrderStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An order that is {order.status.value} cannot be cancelled.",
        )

    for item in order.items:
        if item.product_id:
            product = db.get(Product, item.product_id)
            if product:
                product.stock += item.quantity

    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order)


# --------------------------------------------------------------------------
# Admin
# --------------------------------------------------------------------------
@router.get("/admin/orders", response_model=list[OrderOut])
def all_orders(admin: AdminUser, db: DbSession, limit: int = 100) -> list[OrderOut]:
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(limit)
    ).all()
    return [OrderOut.model_validate(o) for o in orders]


@router.patch("/admin/orders/{order_number}", response_model=OrderOut)
def update_order_status(
    order_number: str, payload: OrderStatusUpdate, admin: AdminUser, db: DbSession
) -> OrderOut:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == order_number.upper())
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order.status = OrderStatus(payload.status)
    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order)
