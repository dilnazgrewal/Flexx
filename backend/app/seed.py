"""Seed the database with the Flexx catalogue.

The data below is the original hardcoded front-end catalogue, promoted to
real rows and enriched with the fields a real storefront needs (stock,
nutrition, long copy, reviews).

Run directly:  python -m app.seed  [--reset]
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import (
    Category,
    Coupon,
    Faq,
    Product,
    Review,
    Testimonial,
    User,
)
from app.security import hash_password

CATEGORIES = [
    {
        "slug": "protein-bars",
        "name": "Protein Bars",
        "description": "Quick protein for drive.",
        "image": "/images/flexx-protein-bar-vertical.jpg",
        "image_position": "right center",
    },
    {
        "slug": "snack-bars",
        "name": "Snack Bars",
        "description": "Small snacks, serious performance.",
        "image": "/images/flexx-three-protein-bars.jpg",
        "image_position": "right center",
    },
    {
        "slug": "refill-packs",
        "name": "Refill Packs",
        "description": "More protein, more value.",
        "image": "/images/flexx-chocolate-refill-pack.jpg",
        "image_position": "right center",
    },
    {
        "slug": "protein-tubs",
        "name": "Protein Tubs",
        "description": "Daily fuel for long-term progress.",
        "image": "/images/flexx-chocolate-protein-powder-tub.jpg",
        "image_position": "right center",
    },
    {
        "slug": "shakers-bottles",
        "name": "Shakers & Bottles",
        "description": "Carry your performance everywhere.",
        "image": "/images/flexx-two-shakers.jpg",
        "image_position": "right center",
    },
]

POWDER_INGREDIENTS = (
    "Whey protein concentrate, whey protein isolate, natural flavouring, "
    "cocoa powder, sunflower lecithin, sea salt, stevia leaf extract."
)
BAR_INGREDIENTS = (
    "Protein blend (milk protein isolate, whey protein isolate), soluble corn fibre, "
    "almonds, cocoa butter, natural flavouring, sea salt."
)

PRODUCTS = [
    {
        "slug": "chocolate-whey",
        "name": "Flexx Whey Protein",
        "flavor": "Rich Chocolate",
        "category": "protein-tubs",
        "price": 69.99,
        "original_price": 89.99,
        "protein_per_serving": 24,
        "calories": 120,
        "servings": 30,
        "weight_grams": 900,
        "stock": 48,
        "tag": "Best seller",
        "is_featured": True,
        "image": "/images/flexx-chocolate-protein-powder-tub.jpg",
        "hover_image": "/images/flexx-chocolate-tub-man-balcony.jpg",
        "gallery": [
            "/images/flexx-chocolate-protein-powder-tub.jpg",
            "/images/flexx-chocolate-tub-man-balcony.jpg",
            "/images/flexx-chocolate-protein-tub.jpg",
        ],
        "short_description": "24g of whey protein per scoop in a deep, roasted cocoa flavour.",
        "description": (
            "A cold-filtered whey blend built for recovery that actually tastes like "
            "chocolate instead of chalk. Each 30g scoop delivers 24g of protein and "
            "5.5g of BCAAs, mixes clean in water or milk, and leaves no grit at the "
            "bottom of the shaker. No proprietary blends, no fillers."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "vanilla-whey",
        "name": "Flexx Whey Protein",
        "flavor": "Vanilla Cream",
        "category": "protein-tubs",
        "price": 69.99,
        "original_price": 89.99,
        "protein_per_serving": 24,
        "calories": 115,
        "servings": 30,
        "weight_grams": 900,
        "stock": 36,
        "tag": "Best seller",
        "is_featured": True,
        "image": "/images/flexx-vanilla-protein-tub.jpg",
        "hover_image": "/images/flexx-vanilla-protein.jpg",
        "gallery": [
            "/images/flexx-vanilla-protein-tub.jpg",
            "/images/flexx-vanilla-protein.jpg",
        ],
        "short_description": "Smooth Madagascan vanilla with 24g of protein per serving.",
        "description": (
            "The most mixable tub we make. Vanilla Cream is deliberately understated "
            "so it works on its own, in oats, or blended into a smoothie without "
            "fighting the other ingredients. 24g protein, 2g carbs, 1g sugar."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "strawberry-whey",
        "name": "Flexx Whey Protein",
        "flavor": "Strawberry",
        "category": "protein-tubs",
        "price": 69.99,
        "original_price": 89.99,
        "protein_per_serving": 24,
        "calories": 118,
        "servings": 30,
        "weight_grams": 900,
        "stock": 27,
        "tag": "New",
        "is_featured": True,
        "image": "/images/flexx-strawberry-protein-powder-pack.jpg",
        "hover_image": "/images/flexx-strawberry-powder-woman.jpg",
        "gallery": [
            "/images/flexx-strawberry-protein-powder-pack.jpg",
            "/images/flexx-strawberry-powder-woman.jpg",
            "/images/flexx-strawberry-clean-hero.jpg",
        ],
        "short_description": "Real strawberry, no synthetic aftertaste. 24g protein.",
        "description": (
            "Our newest flavour, built on freeze-dried strawberry rather than candy "
            "flavouring. Light enough to drink straight after a hard session when "
            "nothing heavy appeals."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "chocolate-refill",
        "name": "Flexx Refill Pack",
        "flavor": "Chocolate",
        "category": "refill-packs",
        "price": 54.99,
        "original_price": 69.99,
        "protein_per_serving": 24,
        "calories": 120,
        "servings": 30,
        "weight_grams": 900,
        "stock": 60,
        "tag": "Value",
        "image": "/images/flexx-chocolate-refill-pack.jpg",
        "hover_image": "/images/flexx-chocolat-woman-outdoor.jpg",
        "gallery": [
            "/images/flexx-chocolate-refill-pack.jpg",
            "/images/flexx-chocolat-woman-outdoor.jpg",
        ],
        "short_description": "Same protein, 78% less packaging, lower price.",
        "description": (
            "A flat refill pouch that tops up the tub you already own. Identical "
            "formula to the Rich Chocolate tub, 78% less plastic, and $15 cheaper "
            "per 30 servings."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "chocolate-bar",
        "name": "Flexx Protein Bar",
        "flavor": "Chocolate Crunch",
        "category": "protein-bars",
        "price": 2.79,
        "original_price": 4.99,
        "protein_per_serving": 20,
        "calories": 210,
        "servings": 1,
        "weight_grams": 60,
        "stock": 240,
        "tag": "Best seller",
        "is_featured": True,
        "image": "/images/flexx-chocolate-protein-bar.jpg",
        "hover_image": "/images/flexx-protein-bar-alternative.jpg",
        "gallery": [
            "/images/flexx-chocolate-protein-bar.jpg",
            "/images/flexx-protein-bar-alternative.jpg",
            "/images/flexx-chocobar.jpg",
        ],
        "short_description": "20g protein, 2g sugar, and an actual crunch.",
        "description": (
            "Most protein bars are either chewy enough to break a jaw or sweet "
            "enough to count as dessert. This one is neither: a crisp rice core, a "
            "real cocoa butter coating, 20g of protein and 2g of sugar."
        ),
        "ingredients": BAR_INGREDIENTS,
    },
    {
        "slug": "vanilla-bar",
        "name": "Flexx Protein Bar",
        "flavor": "Vanilla",
        "category": "protein-bars",
        "price": 2.79,
        "original_price": 4.99,
        "protein_per_serving": 20,
        "calories": 205,
        "servings": 1,
        "weight_grams": 60,
        "stock": 180,
        "tag": "New",
        "image": "/images/flexx-vanilla-protein-bar-horizontal.jpg",
        "hover_image": "/images/flexx-vanilla-bar-man-gym.jpg",
        "gallery": [
            "/images/flexx-vanilla-protein-bar-horizontal.jpg",
            "/images/flexx-vanilla-bar-man-gym.jpg",
        ],
        "short_description": "Vanilla almond crunch with 20g of protein.",
        "description": (
            "Toasted almond and vanilla over the same crisp protein core. The bar "
            "to keep in a gym bag for the days lunch does not happen."
        ),
        "ingredients": BAR_INGREDIENTS,
    },
    {
        "slug": "strawberry-bar",
        "name": "Flexx Protein Bar",
        "flavor": "Strawberry",
        "category": "protein-bars",
        "price": 2.79,
        "original_price": 4.99,
        "protein_per_serving": 20,
        "calories": 200,
        "servings": 1,
        "weight_grams": 60,
        "stock": 150,
        "tag": "New",
        "image": "/images/flexx-protein-bar-vertical.jpg",
        "hover_image": "/images/flexx-three-protein-bars.jpg",
        "gallery": [
            "/images/flexx-protein-bar-vertical.jpg",
            "/images/flexx-three-protein-bars.jpg",
        ],
        "short_description": "Bright strawberry over a crisp protein core.",
        "description": (
            "Freeze-dried strawberry pieces through a white chocolate coating. "
            "20g protein, 2g sugar, and the lightest bar in the range."
        ),
        "ingredients": BAR_INGREDIENTS,
    },
    {
        "slug": "chocolate-tub",
        "name": "Flexx Protein Tub",
        "flavor": "Double Chocolate",
        "category": "protein-tubs",
        "price": 64.99,
        "original_price": 79.99,
        "protein_per_serving": 24,
        "calories": 125,
        "servings": 28,
        "weight_grams": 840,
        "stock": 22,
        "image": "/images/flexx-chocolate-protein-tub.jpg",
        "hover_image": "/images/flexx-chocolate-tub-man-balcony.jpg",
        "gallery": [
            "/images/flexx-chocolate-protein-tub.jpg",
            "/images/flexx-chocolate-tub-man-balcony.jpg",
        ],
        "short_description": "Double-cocoa formula for people who want it darker.",
        "description": (
            "Twice the cocoa of our standard chocolate, with a touch of espresso "
            "powder to round the edges. Built for post-session shakes with milk."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "black-shaker",
        "name": "Flexx Shaker",
        "flavor": "Black Edition",
        "category": "shakers-bottles",
        "price": 14.99,
        "original_price": 19.99,
        "protein_per_serving": 0,
        "calories": None,
        "servings": None,
        "weight_grams": 180,
        "stock": 95,
        "is_featured": True,
        "image": "/images/flexx-shaker-bottle.jpg",
        "hover_image": "/images/flexx-shaker-alternative.jpg",
        "gallery": [
            "/images/flexx-shaker-bottle.jpg",
            "/images/flexx-shaker-alternative.jpg",
        ],
        "short_description": "700ml leak-proof shaker with a stainless mixing ball.",
        "description": (
            "A 700ml BPA-free shaker with a screw-lock lid that does not leak in a "
            "gym bag, a stainless steel mixing ball, and a matte finish that does "
            "not hold fingerprints. Dishwasher safe."
        ),
        "ingredients": "",
    },
    {
        "slug": "shaker-duo",
        "name": "Flexx Shaker Duo",
        "flavor": "Black & Red",
        "category": "shakers-bottles",
        "price": 24.99,
        "original_price": 34.99,
        "protein_per_serving": 0,
        "calories": None,
        "servings": None,
        "weight_grams": 360,
        "stock": 54,
        "tag": "Bundle",
        "image": "/images/flexx-two-shakers.jpg",
        "hover_image": "/images/flexx-shaker-alternative.jpg",
        "gallery": ["/images/flexx-two-shakers.jpg", "/images/flexx-shaker-alternative.jpg"],
        "short_description": "Two 700ml shakers. One for the bag, one for the sink.",
        "description": (
            "The two-pack exists because one shaker is always in the dishwasher. "
            "Same leak-proof lid and stainless mixing ball, in black and red."
        ),
        "ingredients": "",
    },
    {
        "slug": "protein-bar-bundle",
        "name": "Flexx Bar Bundle",
        "flavor": "Mixed Flavours",
        "category": "snack-bars",
        "price": 19.99,
        "original_price": 29.99,
        "protein_per_serving": 20,
        "calories": 205,
        "servings": 9,
        "weight_grams": 540,
        "stock": 70,
        "tag": "Bundle",
        "is_featured": True,
        "image": "/images/flexx-three-protein-bars.jpg",
        "hover_image": "/images/flexx-chocolate-protein-bar.jpg",
        "gallery": [
            "/images/flexx-three-protein-bars.jpg",
            "/images/flexx-chocolate-protein-bar.jpg",
            "/images/flexx-chocobar.jpg",
        ],
        "short_description": "Nine bars, three flavours, one third off.",
        "description": (
            "Three each of Chocolate Crunch, Vanilla and Strawberry. The cheapest "
            "way into the bar range and the easiest way to find your flavour."
        ),
        "ingredients": BAR_INGREDIENTS,
    },
    {
        "slug": "strawberry-collection",
        "name": "Flexx Strawberry Collection",
        "flavor": "Strawberry",
        "category": "refill-packs",
        "price": 74.99,
        "original_price": 99.99,
        "protein_per_serving": 24,
        "calories": 118,
        "servings": 30,
        "weight_grams": 1100,
        "stock": 18,
        "tag": "Bundle",
        "image": "/images/flexx-strawberry-clean-hero.jpg",
        "hover_image": "/images/flexx-strawberry-powder-woman.jpg",
        "gallery": [
            "/images/flexx-strawberry-clean-hero.jpg",
            "/images/flexx-strawberry-powder-woman.jpg",
            "/images/flexx-strawberry-protein-powder-pack.jpg",
        ],
        "short_description": "The strawberry tub, bars and a shaker in one box.",
        "description": (
            "Everything we make in strawberry: one 900g tub, three protein bars and "
            "a Black Edition shaker, boxed together at 25% off the individual price."
        ),
        "ingredients": POWDER_INGREDIENTS,
    },
    {
        "slug": "chocobar-snack",
        "name": "Flexx Choco Snack Bar",
        "flavor": "Milk Chocolate",
        "category": "snack-bars",
        "price": 1.99,
        "original_price": 2.99,
        "protein_per_serving": 12,
        "calories": 140,
        "servings": 1,
        "weight_grams": 40,
        "stock": 320,
        "image": "/images/flexx-chocobar.jpg",
        "hover_image": "/images/flexx-protein-bar-alternative.jpg",
        "gallery": ["/images/flexx-chocobar.jpg"],
        "short_description": "A smaller 12g-protein bar for between meals.",
        "description": (
            "Half the size of the full bar and under 150 calories. For the gap "
            "between lunch and training when a full bar is too much."
        ),
        "ingredients": BAR_INGREDIENTS,
    },
]

TESTIMONIALS = [
    ("Alex Morgan", "Strength athlete", "Flexx Whey Protein",
     "Flexx has become part of my daily recovery routine. The flavour is smooth and the results are consistent.", 5),
    ("Maya Johnson", "Fitness coach", "Flexx Protein Bar",
     "The protein bars are easy to carry, taste great, and keep me fueled between training sessions.", 5),
    ("Daniel Carter", "Performance athlete", "Flexx Protein Powder",
     "I have tried many protein products, but Flexx gives me the quality and flavour I was looking for.", 4),
    ("Sofia Williams", "Everyday athlete", "Flexx Strawberry Whey",
     "The strawberry flavour is excellent and mixes quickly after my workouts.", 5),
    ("Noah Bennett", "Marathon runner", "Flexx Refill Pack",
     "The refill packs cut my cost per serving and take up almost no space in the cupboard.", 5),
    ("Priya Nair", "CrossFit athlete", "Flexx Shaker",
     "Finally a shaker that does not leak in my bag. Small thing, but it matters every single day.", 5),
]

FAQS = [
    ("What is Flexx protein?",
     "Flexx is a premium protein supplement designed to support training, recovery, and everyday performance."),
    ("When should I take Flexx protein?",
     "You can take it after training, between meals, or whenever you need additional protein during the day."),
    ("How much protein is in one serving?",
     "Each product has different nutritional values. Check the individual product page for exact details."),
    ("Does Flexx ship internationally?",
     "Yes. Enter your address at checkout and shipping is calculated for your location before you pay."),
    ("How long does delivery take?",
     "Orders placed before 2pm ship the same working day. Standard delivery lands in 2-4 working days, and orders over $50 ship free."),
    ("Can I return a product?",
     "If you do not like the flavour, send the tub back within 30 days - opened or not - and we will refund it in full."),
    ("Is Flexx suitable for vegetarians?",
     "The whey range is vegetarian. The bars contain milk protein. Nothing in the range contains gelatine."),
    ("How do I track my order?",
     "Use the Track Order page with your order number and email, or open the Orders tab in your account."),
]

COUPONS = [
    ("FLEXX10", "10% off your order.", "percent", 10.0, 0.0),
    ("WELCOME15", "15% off your first order.", "percent", 15.0, 40.0),
    ("BULK25", "$25 off orders over $150.", "fixed", 25.0, 150.0),
]

REVIEW_SNIPPETS = [
    (5, "Exactly what I wanted", "Mixes clean, tastes good, no bloating. Reordering."),
    (5, "Worth the price", "I had been buying cheaper tubs and kept throwing them out. Not this one."),
    (4, "Good, slightly sweet", "Great texture and flavour, though I use a little less than a full scoop."),
    (5, "Daily staple now", "Three months in and it is still the first thing I reach for after training."),
    (4, "Solid", "Does the job well. Delivery was quick too."),
    (5, "Flavour is the best part", "Most proteins taste like a chore. This one does not."),
]

REVIEWERS = [
    "Jordan Blake", "Priya Nair", "Tom Hughes", "Elena Rossi", "Marcus Webb",
    "Aisha Khan", "Liam O'Connor", "Chloe Dubois", "Ravi Mehta", "Hannah Lund",
]


def _label(count: int) -> str:
    if count >= 1000:
        return f"{count / 1000:.1f}k reviews"
    return f"{count} review" + ("s" if count != 1 else "")


def seed(db: Session, *, force: bool = False) -> None:
    if db.scalar(select(Product).limit(1)) is not None and not force:
        print("Database already seeded - skipping. Use --reset to rebuild.")
        return

    rng = random.Random(20251013)

    categories: dict[str, Category] = {}
    for index, data in enumerate(CATEGORIES):
        category = db.scalar(select(Category).where(Category.slug == data["slug"]))
        if category is None:
            category = Category(**data, sort_order=index)
            db.add(category)
        categories[data["slug"]] = category
    db.flush()

    now = datetime.now(timezone.utc)

    for index, data in enumerate(PRODUCTS):
        payload = dict(data)
        category_slug = payload.pop("category")
        if db.scalar(select(Product).where(Product.slug == payload["slug"])):
            continue

        product = Product(
            **payload,
            category_id=categories[category_slug].id,
            sort_order=index,
            created_at=now - timedelta(days=len(PRODUCTS) - index),
        )
        db.add(product)
        db.flush()

        review_count = rng.randint(3, 6)
        picks = rng.sample(REVIEW_SNIPPETS, review_count)
        names = rng.sample(REVIEWERS, review_count)
        for offset, ((rating, title, body), name) in enumerate(zip(picks, names)):
            db.add(
                Review(
                    product_id=product.id,
                    author_name=name,
                    rating=rating,
                    title=title,
                    body=body,
                    is_verified=True,
                    created_at=now - timedelta(days=offset * 6 + 3),
                )
            )

        product.rating = round(sum(p[0] for p in picks) / review_count, 2)
        product.review_count = review_count
        product.review_count_label = _label(review_count)

    for index, (name, role, product_name, review, rating) in enumerate(TESTIMONIALS):
        if not db.scalar(select(Testimonial).where(Testimonial.name == name)):
            db.add(
                Testimonial(
                    name=name,
                    role=role,
                    product=product_name,
                    review=review,
                    rating=rating,
                    sort_order=index,
                )
            )

    for index, (question, answer) in enumerate(FAQS):
        if not db.scalar(select(Faq).where(Faq.question == question)):
            db.add(Faq(question=question, answer=answer, sort_order=index))

    for code, description, discount_type, value, min_subtotal in COUPONS:
        if not db.scalar(select(Coupon).where(Coupon.code == code)):
            db.add(
                Coupon(
                    code=code,
                    description=description,
                    discount_type=discount_type,
                    value=value,
                    min_subtotal=min_subtotal,
                )
            )

    if not db.scalar(select(User).where(User.email == settings.seed_admin_email)):
        db.add(
            User(
                email=settings.seed_admin_email,
                full_name="Flexx Admin",
                password_hash=hash_password(settings.seed_admin_password),
                is_admin=True,
            )
        )

    demo_email = "demo@flexx.com"
    if not db.scalar(select(User).where(User.email == demo_email)):
        db.add(
            User(
                email=demo_email,
                full_name="Demo Customer",
                phone="+1 555 0100",
                password_hash=hash_password("DemoUser123!"),
            )
        )

    db.commit()
    print(
        f"Seeded {len(PRODUCTS)} products, {len(CATEGORIES)} categories, "
        f"{len(FAQS)} FAQs, {len(TESTIMONIALS)} testimonials, {len(COUPONS)} coupons."
    )


def main() -> None:
    reset = "--reset" in sys.argv
    if reset:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db, force=reset)


if __name__ == "__main__":
    main()
