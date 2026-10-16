"use client";

import { useEffect } from "react";

/**
 * Loads the Session-10 sales desk chat widget.
 *
 * `public/chat-widget.js` is the starter kit's file, copied in unchanged.
 * It is configured through `window.SalesDeskConfig`, exactly as the comment
 * at the top of that file describes. On a plain HTML site you would put the
 * two script tags before </body>; this component is the Next.js equivalent,
 * and it sets the config before the widget script loads so the widget always
 * sees it.
 *
 * The endpoint is your deployed Cloudflare Worker, set in `.env.local` as
 * NEXT_PUBLIC_CHAT_ENDPOINT. Leave it empty and the widget says it is not
 * connected yet, which is the expected state before you deploy.
 */

declare global {
  interface Window {
    SalesDeskConfig?: Record<string, unknown>;
    SalesDesk?: { open: (message?: string) => void };
  }
}

const SCRIPT_ID = "sales-desk-widget";

/** Accepts a bare worker address, or one that already ends in /chat. */
function normaliseEndpoint(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  const withoutTrailingSlash = value.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/chat")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/chat`;
}

export function SalesDeskWidget() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    window.SalesDeskConfig = {
      endpoint: normaliseEndpoint(process.env.NEXT_PUBLIC_CHAT_ENDPOINT),
      title: "Flexx Assistant",
      subtitle: "Automated assistant. Trade enquiries go to our team.",
      greeting:
        "Hey. I can help you pick a protein, explain shipping and returns, or pass a wholesale enquiry to our team. What are you after?",
      quickReplies: [
        "Which protein should I pick?",
        "Shipping and returns",
        "What's in the bars?",
        "Stocking Flexx in my gym",
      ],
      launcherLabel: "Chat with us",
      fallbackContact: "hello@flexx.com",
      enquiryNextStep: "Our team will be in touch, usually within one working day.",
      showStructuredData: true,
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "/chat-widget.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
