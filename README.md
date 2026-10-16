# FLEXX — Full-Stack Protein Storefront

A complete e-commerce site: a **Next.js 16 / React 19 / Tailwind v4** storefront on top of a
**Python FastAPI + SQLAlchemy + SQLite** backend. Customers can browse the catalogue, filter and
search, read and write reviews, build a cart, apply coupons, check out, and track orders — guest
or signed in.

> For the story of how it was built — the design decisions, the bugs, and the two chatbot
> architectures that were thrown away — see [BUILD-NOTES.md](BUILD-NOTES.md).

---

## Quick start

Two terminals. Backend first.

### 1. Backend (Python)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first boot it creates `backend/flexx.db` and seeds the catalogue automatically.
Interactive API docs: <http://127.0.0.1:8000/docs>

### 2. Frontend (Next.js)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

| Role     | Email             | Password        |
| -------- | ----------------- | --------------- |
| Customer | demo@flexx.com    | `DemoUser123!`  |
| Admin    | admin@flexx.com   | `FlexxAdmin123!`|

### Coupons

| Code        | Effect                     |
| ----------- | -------------------------- |
| `FLEXX10`   | 10% off                    |
| `WELCOME15` | 15% off orders over $40    |
| `BULK25`    | $25 off orders over $150   |

---

## Architecture

```
Browser ──► Next.js (3000) ──► FastAPI (8000) ──► SQLAlchemy ──► SQLite
            │                   │
            │ server components │ catalogue reads are rendered on the server
            └ client components ┘ cart / auth / checkout run in the browser
```

* **Catalogue pages are server-rendered.** `/`, `/products` and `/products/[slug]` call the API
  from React Server Components, so product data is in the HTML on first paint.
* **Cart, auth and checkout are client-side**, because they depend on per-visitor identity held in
  `localStorage` (`flexx.auth.token`, `flexx.cart.token`).
* **All money maths lives in one place** (`backend/app/pricing.py`) and is used by both the cart
  endpoint and checkout, so the price shown is the price charged. The frontend never computes
  totals.

### Project layout

```
backend/
  app/
    main.py        FastAPI app, CORS, lifespan (creates + seeds the DB)
    config.py      Settings (DB URL, JWT, shipping/tax rules) via pydantic-settings
    database.py    Engine, session factory, declarative Base
    models.py      13 tables (users, products, carts, orders, reviews, ...)
    schemas.py     Pydantic request/response models, snake_case ↔ camelCase
    security.py    PBKDF2 password hashing + JWT issue/verify
    deps.py        Auth dependencies and cart resolution/merging
    pricing.py     Subtotal, coupon, shipping, tax, total
    routers/       auth, catalog, cart, orders, content
    seed.py        Catalogue seed data (`python -m app.seed --reset`)
src/
  app/             Routes: /, /products, /products/[slug], /cart, /checkout,
                   /order/[orderNumber], /orders, /account, /login, /register, /track-order
  components/
    providers/     Toast, Auth and Cart React contexts
    ...            Cart drawer, product card/gallery/filters, review form, order summary
  lib/
    api.ts         Typed API client (works server- and client-side)
    types.ts       Shared TypeScript types mirroring the API
    format.ts      Currency and date formatting
```

---

## Data model

| Table                    | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `users`                  | Accounts, PBKDF2 password hashes, admin flag                       |
| `addresses`              | Saved shipping addresses per user                                  |
| `categories`             | Protein bars, snack bars, refill packs, tubs, shakers              |
| `products`               | Price, stock, nutrition, gallery, denormalised rating              |
| `reviews`                | Per-product reviews; writing one recalculates the product rating   |
| `carts` / `cart_items`   | One cart per user, plus token-identified guest carts               |
| `coupons`                | Percent or fixed discounts with a minimum subtotal                 |
| `orders` / `order_items` | Orders with a **snapshot** of each item (name, price, image)       |
| `testimonials`, `faqs`   | Homepage content, served from the DB                               |
| `newsletter_subscribers` | Footer signups                                                     |

Order items are denormalised on purpose: if a product is renamed, repriced or deleted later, past
orders still show what the customer actually bought.

---

## How ordering works

1. **Add to cart** — the browser POSTs a slug. If it has no cart token the server creates a cart
   and returns its token, which the client stores.
2. **Guest → signed-in merge** — on sign-in, a guest cart is merged into the user's cart
   (quantities combined) and the guest cart is deleted.
3. **Checkout** — the server re-validates stock inside the same transaction that decrements it,
   recomputes totals from scratch, writes the order and its item snapshots, optionally saves the
   address, and empties the cart.
4. **Confirmation** — the customer lands on `/order/FLX-…`. Guest orders are readable by anyone
   holding the unguessable order number; account orders require that account or an admin.
5. **Tracking / cancelling** — `/track-order` takes an order number plus email. Cancelling an
   order that has not shipped returns its stock to the catalogue.

---

## API reference

Base URL `http://127.0.0.1:8000/api`. Full interactive docs at `/docs`.

### Catalogue
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/products` | `category, search, featured, inStock, minPrice, maxPrice, sort, page, pageSize` |
| GET | `/products/{slug}` | Full detail incl. reviews |
| GET | `/products/{slug}/related` | Same-category suggestions |
| POST | `/products/{slug}/reviews` | Creates a review, recalculates the rating |
| GET | `/categories` | With live product counts |
| GET | `/testimonials`, `/faqs` | Homepage content |
| POST | `/newsletter` | Footer signup |

### Cart — identified by the `X-Cart-Token` header, or by the signed-in user
| Method | Path |
| ------ | ---- |
| GET / DELETE | `/cart` |
| POST | `/cart/items` |
| PATCH / DELETE | `/cart/items/{id}` |
| POST / DELETE | `/cart/coupon` |

### Auth — `Authorization: Bearer <jwt>`
`POST /auth/register`, `POST /auth/login`, `GET|PATCH /auth/me`, `POST /auth/change-password`

### Orders
`POST /checkout`, `GET /orders`, `GET /orders/{orderNumber}`, `POST /orders/track`,
`POST /orders/{orderNumber}/cancel`, `GET /admin/orders`, `PATCH /admin/orders/{orderNumber}`

---

## Chatbot — Cloudflare Worker

The site's assistant is the **Session 10 starter kit** bot, adapted for Flexx.

```
Browser ──► public/chat-widget.js ──► your Cloudflare Worker (/chat) ──► LLM API
                                      ▲ LLM_API_KEY lives here, as a Secret
```

The API key never reaches the browser, and the site never calls the LLM directly.

| File | What it is |
| ---- | ---------- |
| [my-bot/worker.js](my-bot/worker.js) | The Worker. Starter file with **only** Sections 2 and 3 rewritten for Flexx; Sections 1 and 4 are byte-identical (checked with `diff`). |
| [my-bot/README.md](my-bot/README.md) | Deploy steps, the four variables, what the bot knows and may say. |
| [my-bot/wrangler.toml](my-bot/wrangler.toml) | Optional command-line deploy. |
| [public/chat-widget.js](public/chat-widget.js) | The starter widget, copied in **unchanged** (same MD5). |
| [src/components/sales-desk-widget.tsx](src/components/sales-desk-widget.tsx) | Sets `window.SalesDeskConfig`, then loads the widget — the Next.js equivalent of the two script tags before `</body>`. |

### The four variables

Set in **Cloudflare → your Worker → Settings → Variables and Secrets**, never in a file:

| Name | Type | Example |
| --- | --- | --- |
| `LLM_BASE_URL` | Text | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Text | `openai/gpt-oss-120b` |
| `LLM_API_KEY` | **Secret** | your `gsk_...` key |
| `ALLOWED_ORIGINS` | Text | `*` while testing, then your real site address |

Then put the Worker's address in `.env.local` and restart `npm run dev`:

```
NEXT_PUBLIC_CHAT_ENDPOINT=https://<your-worker>.workers.dev
```

`/chat` is appended for you, and not twice if you include it. Until the endpoint is set the
widget opens and says it is not connected to a backend yet — that is the expected state before
you deploy.

### Styling

The widget reads `--sd-accent`, `--sd-accent-ink`, `--sd-bg`, `--sd-surface`, `--sd-ink`,
`--sd-muted` and `--sd-rule`. These are set to the Flexx palette in
[globals.css](src/app/globals.css), so the chat matches the site without touching the widget
file. It renders in a shadow root, so none of the site's CSS can leak into it.

### What it does

Answers questions about products, ingredients, prices, shipping, returns and ordering from the
facts in Section 2, and raises a structured **enquiry** for trade interest (wholesale, gym or
shop stocking, distributorship, own-brand). It deliberately **cannot look up orders** — those go
to `/track-order` — and it will not confirm live stock or give medical advice. Full rules in
[my-bot/README.md](my-bot/README.md).

### Live deployment

```
https://flexx-bot.dilnazkaur285.workers.dev
```

Endpoint is that address plus `/chat`. A **GET** returns a health JSON and never touches the
LLM, so it answers `ok:true` even when `LLM_API_KEY` is missing — only a **POST** proves the
key is set. Opening the address in a browser shows JSON, not the shop: the Worker is the chat
backend and serves no pages.

Note that `.dev.vars` (read by `wrangler dev`) and `wrangler secret put` (read by the deployed
Worker) are two separate stores. Setting one does nothing for the other.

### Testing the chatbot

[my-bot/test.md](my-bot/test.md) holds 15 tests — 5 fact, 4 must-not-promise, 2 off-topic,
2 trick, 2 real-customer — with the expected answer for each and a score log.

```bash
cd my-bot
node run-tests.mjs                                  # against npx wrangler dev
node run-tests.mjs https://<worker>.workers.dev/chat  # against the deployed Worker
```

The runner prints every reply instead of string-matching, because the pass criteria are about
meaning ("doesn't confirm stock", "stays in role") and a keyword matcher would both false-pass
and false-fail. It paces requests 24s apart: Groq's free tier allows 8,000 tokens/minute and
each call costs ~2,600, so roughly 3 calls/minute. Unpaced, two thirds of the suite fails with
502s that look like bot failures but are only quota. A full run takes about 6 minutes.

Current score: **15/15**, verified against the deployed Worker.

---

## Configuration

Frontend — `.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Backend — create `backend/.env` to override any value in `app/config.py`:

```
DATABASE_URL=sqlite:///./flexx.db
JWT_SECRET=change-me-in-production
FREE_SHIPPING_THRESHOLD=50
SHIPPING_FLAT_RATE=4.99
TAX_RATE=0.08
```

### Moving to PostgreSQL

Nothing in the code is SQLite-specific. Install a driver and change one line:

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/flexx
```

---

## Useful commands

```bash
# Rebuild the database from scratch
cd backend && .venv\Scripts\python -m app.seed --reset

# Typecheck / build the frontend
npx tsc --noEmit
npm run build
```

---

## Notes

* **Payments are simulated.** Choosing Card or UPI marks the order paid; Cash on Delivery marks it
  unpaid. No card details are collected anywhere in the app, by design.
* Passwords use PBKDF2-HMAC-SHA256 (240k iterations) from the standard library — no native build
  step, which keeps `pip install` reliable on Windows.
* The homepage degrades gracefully: if the API is unreachable, it renders a clear "store is
  offline" page instead of crashing.
