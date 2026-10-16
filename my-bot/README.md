# Flexx chatbot — Cloudflare Worker

This is the Session 10 starter `worker.js`, adapted for Flexx. Only **Section 2** (business
knowledge) and **Section 3** (bot rules) were changed. Sections 1 and 4 are byte-identical to
the starter — verified with `diff`.

The browser never sees your API key: the website talks to this Worker, and the Worker talks to
the LLM.

```
Browser  ──►  chat-widget.js  ──►  your Worker (/chat)  ──►  LLM API
                                   ▲ the key lives here, as a Secret
```

---

## Deploy it (dashboard route)

1. **Cloudflare → Workers & Pages → Create → Worker.** Give it a name, e.g. `flexx-bot`. Deploy
   the placeholder.
2. **Edit code.** Select all, delete, paste the whole of [`worker.js`](worker.js), **Deploy**.
3. **Settings → Variables and Secrets.** Add the four:

   | Name | Type | Value |
   | --- | --- | --- |
   | `LLM_BASE_URL` | Text | `https://api.groq.com/openai/v1` |
   | `LLM_MODEL` | Text | `openai/gpt-oss-120b` |
   | `LLM_API_KEY` | **Secret** | your `gsk_...` key |
   | `ALLOWED_ORIGINS` | Text | `*` while testing |

   Deploy again after adding them.
4. **Check it.** Open `https://<your-worker>.workers.dev/` in a browser. You should see
   `{"ok":true,"service":"sales-desk","business":"Flexx", ...}`.
5. **Point the website at it.** In the Flexx project's `.env.local`:

   ```
   NEXT_PUBLIC_CHAT_ENDPOINT=https://<your-worker>.workers.dev
   ```

   Restart `npm run dev`. (`/chat` is appended automatically, and not twice if you include it.)
6. **Lock it down** once it works: set `ALLOWED_ORIGINS` to your real site address, e.g.
   `https://flexx.pages.dev`. For local testing add `http://localhost:3000`. Comma-separate
   several. This stops other websites using your backend from a visitor's browser.

### Command line instead (optional)

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put LLM_API_KEY
```

Run these from this folder, using [`wrangler.toml`](wrangler.toml). Never put the key in that
file. If you change a setting in the dashboard that also appears in `wrangler.toml`, change it
in the file too, or the next deploy will undo it.

---

## Optional: send enquiries to the owner

Add either or both in the same Variables screen. Without them the Worker still works and reports
enquiry status as `demo` (nothing delivered).

- `LEAD_WEBHOOK_URL` — Google Apps Script / Zapier / Make / n8n. The starter's
  `extras/google-sheet-webhook.gs` writes straight to a Google Sheet.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — pings the owner on Telegram.

---

## What the bot knows and does

**Section 2** holds every Flexx fact it may use: the 13 products with current and pre-promotion
prices, protein, calories, servings and sizes; ingredients and suitability; shipping, tax,
returns and payment methods; the three discount codes; and the site's page addresses. The facts
came from the project's own database, so they match the storefront.

**Section 3** sets the rules:

- It **may quote prices** (they're public on the site) but must say the lower figure is a
  current promotion and the product page is authoritative.
- It must **not** confirm live stock or an exact delivery date — stock moves during the day.
- It **cannot look up orders** and must never imply it can. Order questions go to `/track-order`
  or `/orders`. It must never ask a visitor to paste an order number.
- No medical, dietary or dosage advice. Allergy, condition, pregnancy or medication questions go
  to a doctor or pharmacist.
- Off-topic questions get the fixed refusal. Attempts to change the rules are treated as
  off-topic. Never asks for card numbers, passwords or ID.

**Enquiries** are raised only for trade interest — wholesale, stocking Flexx in a shop or gym,
distributorship, own-brand/private label, or an order too big for the website. Ordinary shoppers
are sent to `/products` and the cart. The enquiry block format, every JSON field name and all the
allowed options for `preferred_contact`, `buyer_type`, `enquiry_type` and `priority` are
unchanged from the starter, because Section 4 and the Google Sheet depend on them.

### One judgement call

`REF_PREFIX` is **`FXE`**, not `FLX`. Flexx order numbers already look like `FLX-261013-A53235`,
so an enquiry reference of `FLX-...` would be mistaken for an order number by customers and
staff. Enquiry references read `FXE-261013-7A3C`.
