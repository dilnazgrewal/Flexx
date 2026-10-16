import { ServerCrash } from "lucide-react";

/** Shown when the Next.js server cannot reach the FastAPI backend. */
export function ApiOfflineNotice() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--brand-black)] px-6 py-24 text-white">
      <div className="max-w-lg text-center">
        <ServerCrash className="mx-auto size-10 text-[var(--brand-red)]" />

        <h1 className="mt-6 text-3xl font-bold uppercase leading-none sm:text-4xl">
          The store is offline
        </h1>

        <p className="mt-4 text-sm leading-6 text-white/60">
          The storefront is running, but it cannot reach the Flexx API. Start the
          backend and refresh this page.
        </p>

        <pre className="mt-6 overflow-x-auto border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs text-white/70">
          cd backend{"\n"}
          .venv\Scripts\activate{"\n"}
          uvicorn app.main:app --reload --port 8000
        </pre>
      </div>
    </main>
  );
}
