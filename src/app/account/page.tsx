"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Package } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { changePassword, updateProfile } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function AccountPage() {
  const { user, isLoading, setUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Seed the editable fields from the account, once per signed-in user.
  const [syncedUserId, setSyncedUserId] = useState<number | null>(null);
  if (user && syncedUserId !== user.id) {
    setSyncedUserId(user.id);
    setFullName(user.fullName);
    setPhone(user.phone ?? "");
  }

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/account");
  }, [user, isLoading, router]);

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      setUser(await updateProfile({ fullName: fullName.trim(), phone: phone.trim() }));
      toast("Profile updated.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast("Password changed.", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not change password.",
        "error",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading || !user) {
    return (
      <>
        <SiteHeader variant="solid" />
        <main className="flex min-h-[60vh] items-center justify-center bg-[var(--brand-black)] text-white/40">
          <Loader2 className="size-5 animate-spin" />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-[70vh] bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1000px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold uppercase leading-none text-[#928886] sm:text-5xl">
                My account
              </h1>
              <p className="mt-4 text-sm text-white/50">
                {user.email} · member since {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/orders"
                className="flex items-center gap-2 border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:text-white"
              >
                <Package className="size-4" /> My orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-[var(--brand-red)]"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <form
              onSubmit={handleProfileSave}
              className="border border-white/10 bg-white/[0.02] p-6"
            >
              <h2 className="text-lg font-bold uppercase">Profile</h2>

              <div className="mt-6 flex flex-col gap-5">
                <Field id="accountName" label="Full name" value={fullName} onChange={setFullName} />
                <Field id="accountPhone" label="Phone" value={phone} onChange={setPhone} />

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="mt-1 flex items-center justify-center gap-2 bg-[var(--brand-red)] py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)] disabled:opacity-60"
                >
                  {isSavingProfile && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>

            <form
              onSubmit={handlePasswordSave}
              className="border border-white/10 bg-white/[0.02] p-6"
            >
              <h2 className="text-lg font-bold uppercase">Password</h2>

              <div className="mt-6 flex flex-col gap-5">
                <Field
                  id="currentPassword"
                  label="Current password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />
                <Field
                  id="newPassword"
                  label="New password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={setNewPassword}
                />

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="mt-1 flex items-center justify-center gap-2 border border-white/15 py-3.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-[var(--brand-red)] hover:text-white disabled:opacity-60"
                >
                  {isSavingPassword && <Loader2 className="size-4 animate-spin" />}
                  Change password
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-widest text-white/40"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--brand-red)]"
      />
    </div>
  );
}
