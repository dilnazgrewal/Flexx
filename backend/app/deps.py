"""Shared FastAPI dependencies: auth and cart resolution."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cart, User
from app.security import decode_access_token, new_cart_token

DbSession = Annotated[Session, Depends(get_db)]


def _user_from_token(db: Session, authorization: str | None) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    payload = decode_access_token(authorization.split(" ", 1)[1].strip())
    if not payload:
        return None
    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        return None
    user = db.get(User, user_id)
    if user and user.is_active:
        return user
    return None


def get_optional_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User | None:
    return _user_from_token(db, authorization)


def get_current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    user = _user_from_token(db, authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
AdminUser = Annotated[User, Depends(get_current_admin)]


def resolve_cart(
    db: Session,
    cart_token: str | None,
    user: User | None,
    *,
    create: bool = True,
) -> Cart | None:
    """Find the right cart for this request.

    Rules:
      * A signed-in user always gets their own cart.
      * If the request also carries a guest cart token, that guest cart is
        merged into the user cart once and then discarded.
      * Anonymous visitors are identified purely by the cart token.
    """
    guest_cart = None
    if cart_token:
        guest_cart = db.scalar(select(Cart).where(Cart.token == cart_token))

    if user is None:
        if guest_cart is not None and guest_cart.user_id is None:
            return guest_cart
        if not create:
            return None
        cart = Cart(token=new_cart_token())
        db.add(cart)
        db.flush()
        return cart

    user_cart = db.scalar(select(Cart).where(Cart.user_id == user.id))
    if user_cart is None:
        if guest_cart is not None and guest_cart.user_id is None:
            guest_cart.user_id = user.id
            db.flush()
            return guest_cart
        if not create:
            return None
        user_cart = Cart(token=new_cart_token(), user_id=user.id)
        db.add(user_cart)
        db.flush()
        return user_cart

    if guest_cart is not None and guest_cart.id != user_cart.id and guest_cart.user_id is None:
        _merge_carts(db, source=guest_cart, target=user_cart)

    return user_cart


def _merge_carts(db: Session, *, source: Cart, target: Cart) -> None:
    existing = {item.product_id: item for item in target.items}
    for item in list(source.items):
        if item.product_id in existing:
            existing[item.product_id].quantity = min(
                99, existing[item.product_id].quantity + item.quantity
            )
        else:
            item.cart_id = target.id
            target.items.append(item)
    db.delete(source)
    db.flush()
