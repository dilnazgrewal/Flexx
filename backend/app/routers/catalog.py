"""Product and category browsing endpoints."""

from __future__ import annotations

import math
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.deps import DbSession, OptionalUser
from app.models import Category, Product, Review
from app.schemas import (
    CategoryOut,
    ProductDetail,
    ProductListResponse,
    ProductSummary,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter(tags=["catalog"])

SortKey = Literal["featured", "price-asc", "price-desc", "rating", "newest", "name"]


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DbSession) -> list[CategoryOut]:
    counts = dict(
        db.execute(
            select(Product.category_id, func.count(Product.id))
            .where(Product.is_active.is_(True))
            .group_by(Product.category_id)
        ).all()
    )
    categories = db.scalars(select(Category).order_by(Category.sort_order, Category.name)).all()
    return [
        CategoryOut(
            id=c.id,
            slug=c.slug,
            name=c.name,
            description=c.description,
            image=c.image,
            image_position=c.image_position,
            product_count=counts.get(c.id, 0),
        )
        for c in categories
    ]


@router.get("/products", response_model=ProductListResponse)
def list_products(
    db: DbSession,
    category: Annotated[str | None, Query(description="Category slug")] = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
    featured: Annotated[bool | None, Query()] = None,
    in_stock: Annotated[bool | None, Query(alias="inStock")] = None,
    min_price: Annotated[float | None, Query(alias="minPrice", ge=0)] = None,
    max_price: Annotated[float | None, Query(alias="maxPrice", ge=0)] = None,
    sort: Annotated[SortKey, Query()] = "featured",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=60)] = 12,
) -> ProductListResponse:
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.is_active.is_(True))
    )

    if category:
        stmt = stmt.join(Category).where(Category.slug == category)
    if featured is not None:
        stmt = stmt.where(Product.is_featured.is_(featured))
    if in_stock:
        stmt = stmt.where(Product.stock > 0)
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(pattern),
                Product.flavor.ilike(pattern),
                Product.short_description.ilike(pattern),
            )
        )

    order_by = {
        "featured": (Product.is_featured.desc(), Product.sort_order, Product.id),
        "price-asc": (Product.price.asc(), Product.id),
        "price-desc": (Product.price.desc(), Product.id),
        "rating": (Product.rating.desc(), Product.review_count.desc()),
        "newest": (Product.created_at.desc(), Product.id.desc()),
        "name": (Product.name.asc(), Product.flavor.asc()),
    }[sort]

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(*order_by).offset((page - 1) * page_size).limit(page_size)
    ).all()

    return ProductListResponse(
        items=[ProductSummary.model_validate(p) for p in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/products/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: DbSession) -> ProductDetail:
    product = db.scalar(
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.reviews))
        .where(Product.slug == slug, Product.is_active.is_(True))
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    detail = ProductDetail.model_validate(product)
    detail.reviews = [
        ReviewOut.model_validate(r)
        for r in sorted(product.reviews, key=lambda r: r.created_at, reverse=True)
    ]
    return detail


@router.get("/products/{slug}/related", response_model=list[ProductSummary])
def related_products(slug: str, db: DbSession, limit: int = 4) -> list[ProductSummary]:
    product = db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id != product.id, Product.is_active.is_(True))
    )
    if product.category_id:
        stmt = stmt.where(Product.category_id == product.category_id)

    rows = db.scalars(stmt.order_by(Product.rating.desc()).limit(limit)).all()
    if len(rows) < limit:
        extra = db.scalars(
            select(Product)
            .options(selectinload(Product.category))
            .where(
                Product.id != product.id,
                Product.is_active.is_(True),
                Product.id.notin_([r.id for r in rows] or [0]),
            )
            .order_by(Product.rating.desc())
            .limit(limit - len(rows))
        ).all()
        rows = [*rows, *extra]

    return [ProductSummary.model_validate(p) for p in rows]


@router.post(
    "/products/{slug}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    slug: str, payload: ReviewCreate, db: DbSession, user: OptionalUser
) -> ReviewOut:
    product = db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    author = payload.author_name or (user.full_name if user else None)
    if not author:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sign in or provide a name to leave a review.",
        )

    review = Review(
        product_id=product.id,
        user_id=user.id if user else None,
        author_name=author.strip(),
        rating=payload.rating,
        title=payload.title.strip(),
        body=payload.body.strip(),
        is_verified=user is not None,
    )
    db.add(review)
    db.flush()

    # Keep the denormalised rating columns in sync.
    stats = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.product_id == product.id
        )
    ).one()
    product.rating = round(float(stats[0] or 5.0), 2)
    product.review_count = int(stats[1] or 0)
    product.review_count_label = f"{product.review_count} reviews"

    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)
