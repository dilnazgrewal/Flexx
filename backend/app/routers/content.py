"""Marketing content served from the database: testimonials, FAQs, newsletter."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select

from app.deps import DbSession
from app.models import Faq, NewsletterSubscriber, Testimonial
from app.schemas import FaqOut, MessageResponse, NewsletterRequest, TestimonialOut

router = APIRouter(tags=["content"])


@router.get("/testimonials", response_model=list[TestimonialOut])
def list_testimonials(db: DbSession) -> list[TestimonialOut]:
    rows = db.scalars(select(Testimonial).order_by(Testimonial.sort_order, Testimonial.id)).all()
    return [TestimonialOut.model_validate(r) for r in rows]


@router.get("/faqs", response_model=list[FaqOut])
def list_faqs(db: DbSession) -> list[FaqOut]:
    rows = db.scalars(select(Faq).order_by(Faq.sort_order, Faq.id)).all()
    return [FaqOut.model_validate(r) for r in rows]


@router.post("/newsletter", response_model=MessageResponse)
def subscribe(payload: NewsletterRequest, db: DbSession) -> MessageResponse:
    email = payload.email.lower().strip()
    existing = db.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email))
    if existing:
        return MessageResponse(message="You are already on the list.")
    db.add(NewsletterSubscriber(email=email))
    db.commit()
    return MessageResponse(message="You are in. Watch your inbox for drops and offers.")
