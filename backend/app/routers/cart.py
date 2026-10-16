"""Server-side cart: works for guests (cart token) and signed-in users."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import DbSession, OptionalUser, resolve_cart
from app.models import Cart, CartItem, Product, User
from app.pricing import compute_totals, free_shipping_remaining, lookup_coupon
from app.schemas import (
    AddToCartRequest,
    ApplyCouponRequest,
    CartItemOut,
    CartOut,
    CartTotals,
    UpdateCartItemRequest,
)

router = APIRouter(prefix="/cart", tags=["cart"])

CartTokenHeader = Annotated[str | None, Header(alias="X-Cart-Token")]


def serialize_cart(db: Session, cart: Cart) -> CartOut:
    totals = compute_totals(db, cart)
    items = [
        CartItemOut(
            id=item.id,
            product_id=item.product_id,
            slug=item.product.slug,
            name=item.product.name,
            flavor=item.product.flavor,
            image=item.product.image,
            unit_price=item.product.price,
            original_price=item.product.original_price,
            quantity=item.quantity,
            line_total=round(item.product.price * item.quantity, 2),
            stock=item.product.stock,
            in_stock=item.product.stock > 0,
        )
        for item in cart.items
    ]
    return CartOut(
        token=cart.token,
        items=items,
        coupon_code=totals.coupon_code,
        coupon_message=totals.coupon_message,
        totals=CartTotals(
            subtotal=totals.subtotal,
            discount=totals.discount,
            shipping=totals.shipping,
            tax=totals.tax,
            total=totals.total,
            item_count=totals.item_count,
            free_shipping_threshold=settings.free_shipping_threshold,
            free_shipping_remaining=free_shipping_remaining(totals.subtotal, totals.discount),
        ),
    )


def _load_cart(db: Session, cart_token: str | None, user: User | None) -> Cart:
    cart = resolve_cart(db, cart_token, user, create=True)
    assert cart is not None
    return cart


@router.get("", response_model=CartOut)
def get_cart(db: DbSession, user: OptionalUser, cart_token: CartTokenHeader = None) -> CartOut:
    cart = _load_cart(db, cart_token, user)
    db.commit()
    return serialize_cart(db, cart)


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_item(
    payload: AddToCartRequest,
    db: DbSession,
    user: OptionalUser,
    cart_token: CartTokenHeader = None,
) -> CartOut:
    stmt = select(Product).where(Product.is_active.is_(True))
    stmt = (
        stmt.where(Product.id == payload.product_id)
        if payload.product_id
        else stmt.where(Product.slug == payload.slug)
    )
    product = db.scalar(stmt)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.stock <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"{product.name} is out of stock."
        )

    cart = _load_cart(db, cart_token, user)
    item = db.scalar(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id)
    )
    desired = (item.quantity if item else 0) + payload.quantity
    if desired > product.stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only {product.stock} left in stock for {product.name}.",
        )

    if item:
        item.quantity = desired
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=payload.quantity))

    db.commit()
    db.refresh(cart)
    return serialize_cart(db, cart)


@router.patch("/items/{item_id}", response_model=CartOut)
def update_item(
    item_id: int,
    payload: UpdateCartItemRequest,
    db: DbSession,
    user: OptionalUser,
    cart_token: CartTokenHeader = None,
) -> CartOut:
    cart = _load_cart(db, cart_token, user)
    item = db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")

    if payload.quantity == 0:
        db.delete(item)
    else:
        if payload.quantity > item.product.stock:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only {item.product.stock} left in stock.",
            )
        item.quantity = payload.quantity

    db.commit()
    db.refresh(cart)
    return serialize_cart(db, cart)


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_item(
    item_id: int,
    db: DbSession,
    user: OptionalUser,
    cart_token: CartTokenHeader = None,
) -> CartOut:
    cart = _load_cart(db, cart_token, user)
    item = db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    if item:
        db.delete(item)
        db.commit()
        db.refresh(cart)
    return serialize_cart(db, cart)


@router.delete("", response_model=CartOut)
def clear_cart(
    db: DbSession, user: OptionalUser, cart_token: CartTokenHeader = None
) -> CartOut:
    cart = _load_cart(db, cart_token, user)
    for item in list(cart.items):
        db.delete(item)
    cart.coupon_code = None
    db.commit()
    db.refresh(cart)
    return serialize_cart(db, cart)


@router.post("/coupon", response_model=CartOut)
def apply_coupon(
    payload: ApplyCouponRequest,
    db: DbSession,
    user: OptionalUser,
    cart_token: CartTokenHeader = None,
) -> CartOut:
    coupon = lookup_coupon(db, payload.code)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="That coupon code is not valid."
        )

    cart = _load_cart(db, cart_token, user)
    totals = compute_totals(db, cart)
    if totals.subtotal < coupon.min_subtotal:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Spend ${coupon.min_subtotal:.2f} or more to use {coupon.code}.",
        )

    cart.coupon_code = coupon.code
    db.commit()
    db.refresh(cart)
    return serialize_cart(db, cart)


@router.delete("/coupon", response_model=CartOut)
def remove_coupon(
    db: DbSession, user: OptionalUser, cart_token: CartTokenHeader = None
) -> CartOut:
    cart = _load_cart(db, cart_token, user)
    cart.coupon_code = None
    db.commit()
    db.refresh(cart)
    return serialize_cart(db, cart)
