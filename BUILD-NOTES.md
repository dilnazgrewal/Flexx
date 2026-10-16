# Build notes — Flexx

How this project went from a static front-end to a working store with a chatbot:
what was built, why each decision was made, what broke, and what is still
unverified.

*Written 13 October 2026. Companion to [README.md](README.md), which is the
reference documentation; this file is the narrative.*

---

## Contents

1. [The starting point](#1-the-starting-point)
2. [Backend — Python](#2-backend--python)
3. [Front-end — rewired, not redesigned](#3-front-end--rewired-not-redesigned)
4. [Bugs hit along the way](#4-bugs-hit-along-the-way)
5. [The chatbot — built three times](#5-the-chatbot--built-three-times)
6. [Cleanup](#6-cleanup)
7. [Current state](#7-current-state)
8. [Running it](#8-running-it)

---

## 1. The starting point

A Next.js 16 / React 19 / Tailwind v4 front-end. Well designed, and entirely
static. All content lived in five hardcoded arrays in `src/data/`:

| File | Contents |
| ---- | -------- |
| `products.ts` | 3 featured products |
| `mock-products.ts` | 12 catalogue products |
| `categories.ts` | 5 categories |
| `faqs.ts` | 4 FAQs |
| `testimonials.ts` | 4 testimonials |

No backend, no database, no cart, no way to buy anything. Product cards were
display-only — "add to cart" did not exist as a concept anywhere in the code.

The goal: a complete, working store, with the backend and database in Python,
keeping the existing design.

---

## 2. Backend — Python

**Stack:** FastAPI + SQLAlchemy 2.x + SQLite, in a virtual environment at
`backend/.venv`.

SQLite was chosen so the project runs end-to-end with no external services to
install or configure. Nothing in the code is SQLite-specific — `DATABASE_URL`
is the single line to change for PostgreSQL.

### Why PBKDF2 instead of bcrypt

Password hashing uses `hashlib.pbkdf2_hmac` (SHA-256, 240,000 iterations) from
the Python standard library rather than the more commonly seen bcrypt.

bcrypt requires a native build step that frequently fails on Windows, which
would make `pip install -r requirements.txt` unreliable. PBKDF2 at this
iteration count is a well-accepted choice and needs no compiler. See
[backend/app/security.py](backend/app/security.py).

### The schema

Thirteen tables: `users`, `addresses`, `categories`, `products`, `reviews`,
`carts`, `cart_items`, `coupons`, `orders`, `order_items`, `testimonials`,
`faqs`, `newsletter_subscribers`.

### Four decisions worth understanding

**Money is calculated in exactly one place.**
[backend/app/pricing.py](backend/app/pricing.py) is used by both the cart
endpoint and checkout. The browser never computes a total — it only displays
one the server sent. This is why the price shown in the cart is always exactly
the price charged at checkout.

**Order items are snapshots.** `order_items` stores the product name, flavour,
price and image *as they were at the moment of purchase*. Rename a product,
change its price, or deactivate it later, and past orders still show what the
customer actually bought. This is why `order_items` duplicates data that also
lives in `products` — the duplication is the point.

**Carts merge on sign-in.** A guest gets a server-side cart identified by an
`X-Cart-Token` header, stored in `localStorage`. When they sign in, that guest
cart is merged into their account cart (quantities combined) and the guest cart
is deleted. The logic is in `resolve_cart` in
[backend/app/deps.py](backend/app/deps.py).

**Stock is re-checked inside the transaction that decrements it**, not before
it. Two customers racing for the last tub cannot both succeed. Checkout also
recomputes every total from scratch rather than trusting anything the client
sent.

### Access rules for orders

A guest order is readable by anyone holding its order number, which is
unguessable (`FLX-261013-A53235`). An order attached to an account requires
that account, or an admin. Order *tracking* requires the order number **and**
the matching email together — one without the other returns nothing.

### Seeding

[backend/app/seed.py](backend/app/seed.py) promotes the old hardcoded front-end
arrays into real database rows, enriched with the fields a real store needs:
stock levels, nutrition, long-form copy, galleries. It also creates reviews,
three coupon codes, an admin user and a demo customer. The database is created
and seeded automatically on first boot, so there is no separate setup step.

---

## 3. Front-end — rewired, not redesigned

The visual core was kept deliberately intact: the hero, the section rhythm, the
red/black palette, the Bebas display font, the slide-in animations, the hover
image sliders. What changed is where the data comes from, and what a visitor
can actually *do*.

### The server/client split

Catalogue pages — `/`, `/products`, `/products/[slug]` — are React Server
Components that call the API on the server. Product data is therefore in the
HTML on first paint, which is good for both speed and search engines.

Cart, auth and checkout are client components, because they depend on
per-visitor identity held in `localStorage` (`flexx.auth.token`,
`flexx.cart.token`).

[src/lib/api.ts](src/lib/api.ts) is a single typed client that works in both
places, attaching the auth and cart headers automatically when it runs in the
browser.

### New routes

`/products` (search, category chips, sort, in-stock filter, pagination),
`/products/[slug]` (gallery, nutrition, reviews with a working review form,
related items), `/cart`, `/checkout`, `/order/[orderNumber]`, `/orders`,
`/account`, `/login`, `/register`, `/track-order` — plus a slide-out cart
drawer and toast notifications.

`src/data/` was then deleted. Once the database existed, those files were dead
weight that would silently drift out of sync.

---

## 4. Bugs hit along the way

| Bug | Cause and fix |
| --- | ------------- |
| Pydantic schema crash on import | `Annotated[str, Field(...)] \| None` is not valid. Rewritten as `Annotated[str \| None, Field(...)]`. |
| Order status serialised incorrectly | The SQLAlchemy enum needed an explicit `field_validator` to coerce it to its string value. |
| Email rendered as `Testbuyer@Example.Com` | A `capitalize` CSS class wrapped more than intended. Scoped it to the payment-status line only. |
| 5 eslint errors | React's `react-hooks/set-state-in-effect` rule. Three were genuinely wrong and were fixed with the documented "adjust state during render" pattern; two are legitimate mount-time data fetches and carry narrow, commented disables. |

### The one that cost real time

`pkill -f uvicorn` silently does nothing on Windows.

Three bugs in the chatbot's fallback logic were fixed, the server was
"restarted", the tests were re-run — and produced byte-identical wrong output.
The natural conclusion was that the fixes had failed. They had not: the old
process was still bound to port 8000 and still serving the old code.

The actual fix was stopping the process properly through PowerShell
(`Get-CimInstance Win32_Process | ... | Stop-Process`). Worth remembering when
debugging anything on this machine: **if a change seems to have no effect,
confirm the process actually restarted before you start doubting the change.**

---

## 5. The chatbot — built three times

This is the part most worth reading, because it was got wrong twice first.

### Attempt 1 — a chat endpoint inside FastAPI

The brief was "use Cloudflare, four variables". A clarifying question was asked
about *which AI provider*, and the answer was OpenAI through AI Gateway. So the
bot was built inside the Python backend: an `/api/chat` endpoint doing OpenAI
function-calling with six read-only database tools, a custom React widget,
conversation tables, and a retrieval fallback for when no key was configured.

It worked well. It was the wrong architecture.

### Attempt 2 — making the URL configurable

The next question was whether an application would be created in Cloudflare,
with the variables set there, producing a URL. In response, support was added
for a full URL override and for AI Gateway's BYOK mode (the OpenAI key stored
in Cloudflare, with only a Cloudflare token sent from the backend).

Closer. Still wrong.

### Attempt 3 — the actual design

The `session-10-starter/` folder made it obvious:

```
Browser ──► chat-widget.js ──► your Cloudflare Worker (/chat) ──► LLM API
                               ▲ LLM_API_KEY lives here, as a Secret
```

The four variables are the **Worker's** settings — `LLM_BASE_URL`, `LLM_MODEL`,
`LLM_API_KEY`, `ALLOWED_ORIGINS` — set in the Cloudflare dashboard. The entire
point of the design is that the key lives in Cloudflare and never reaches the
browser. The Worker *is* the backend; the website only talks to the Worker.

### What went wrong in the reasoning

After "Cloudflare" was mentioned, the question asked was *which AI provider*,
when the question that actually mattered was *what runs the bot*. One wrong
assumption produced two complete builds that had to be thrown away.

The missed signal was the phrase "the four variables". That specificity meant a
concrete, existing setup was being described — not a preference being
expressed. The right move was to ask to see the reference material the moment
"four variables" did not match the mental model in play.

### What was finally built

| File | What it is |
| ---- | ---------- |
| [my-bot/worker.js](my-bot/worker.js) | The starter worker with **only Sections 2 and 3** rewritten for Flexx. Sections 1 and 4 are byte-identical to the starter, verified with `diff`. |
| [my-bot/README.md](my-bot/README.md) | Deploy steps, the four variables, what the bot may and may not say. |
| [my-bot/wrangler.toml](my-bot/wrangler.toml) | Optional command-line deploy. |
| `public/chat-widget.js` | The starter widget, copied in **unchanged** (identical MD5). |
| [src/components/sales-desk-widget.tsx](src/components/sales-desk-widget.tsx) | Sets `window.SalesDeskConfig`, then loads the widget — the Next.js equivalent of the two script tags before `</body>`. |

Section 2's facts were generated from the project's own database, so the bot's
prices and nutrition match the storefront exactly.

Branding is done through the `--sd-*` CSS variables in
[src/app/globals.css](src/app/globals.css), so the chat matches the site without
modifying the vendored widget file. The widget renders in a shadow root, so no
site CSS leaks into it.

### Two judgement calls

**`REF_PREFIX` is `FXE`, not `FLX`.** Flexx order numbers already look like
`FLX-261013-A53235`. An enquiry reference beginning `FLX-` would be mistaken for
an order number by customers and staff alike. Enquiry references therefore read
`FXE-261013-7A3C`.

**The bot is explicitly forbidden from claiming it can look up orders.** The
Worker has no database access. Rather than let it improvise, Section 3 states
the limit and routes order questions to `/track-order` or `/orders`. It is also
barred from confirming live stock (it changes through the day) and from giving
medical, dietary or dosage advice.

---

## 6. Cleanup

With the Worker bot in place, the FastAPI assistant from attempts 1 and 2 was
removed completely:

- Deleted `backend/app/chat_engine.py`, `chat_tools.py`, `routers/chat.py`
- Unregistered the chat router; dropped `chatAiEnabled` from `/health`
- Removed the chat models, schemas and all gateway settings from config
- Removed `httpx` from `requirements.txt` (only the chat engine used it)
- Removed the chat types and client functions from the front-end
- Dropped the `chat_conversations` and `chat_messages` tables
- Stripped the gateway variables from the env files

`grep -i chat` across `backend/app/` and `src/lib/` now returns nothing.

Two self-inflicted problems during this step: the removal script duplicated the
tail of `config.py`, and it orphaned comment fragments in the env files. Both
were caught and fixed before moving on.

---

## 7. Current state

### Verified working

- The full store: browse, filter, search, product detail, reviews, cart,
  coupons, checkout, order confirmation, tracking, cancellation, accounts
- A real order placed through the browser UI (`FLX-261013-A53235`), with stock
  decrementing and tracking resolving correctly
- Re-verified after the chat removal with a second end-to-end order
- `tsc --noEmit`, `eslint` and `npm run build` all clean
- The chat widget loads, opens, and correctly reports that it is not connected
  to a backend yet
- No console errors

### Not verified

**The Worker has never run against a real LLM**, because that requires an API
key. Everything up to that boundary is checked: syntax (`node --check`),
Sections 1 and 4 integrity (`diff` against the starter), widget loading,
configuration, branding, and the correct pre-deploy state.

### Next step

Deploy the Worker, set the four variables in the Cloudflare dashboard, then put
the Worker's address in `.env.local` as `NEXT_PUBLIC_CHAT_ENDPOINT`. Full
instructions in [my-bot/README.md](my-bot/README.md).

---

## 8. Running it

Two terminals.

```bash
npm run backend
```

```bash
npm run dev
```

The site is at <http://localhost:3000>, the API at <http://127.0.0.1:8000>, and
interactive API docs at <http://127.0.0.1:8000/docs>.

| Role | Email | Password |
| ---- | ----- | -------- |
| Customer | demo@flexx.com | `DemoUser123!` |
| Admin | admin@flexx.com | `FlexxAdmin123!` |

Coupons: `FLEXX10` (10% off), `WELCOME15` (15% over $40), `BULK25` ($25 over
$150).

To rebuild the database from scratch:

```bash
npm run backend:seed
```

---

## A note on the starter pack

`session-10-starter/` was never modified. Files were read from it and copied
out; nothing in it was changed.
