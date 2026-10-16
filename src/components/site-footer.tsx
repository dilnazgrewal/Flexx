import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
    FaFacebookF,
    FaInstagram,
    FaYoutube,
} from "react-icons/fa";
import Image from "next/image";

import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
    return (
        <footer className="bg-[var(--brand-black)] px-4 py-16 text-white sm:px-6 lg:px-10">
            <div className="mx-auto grid max-w-9xl gap-12 border-t border-white/10 pt-12 md:grid-cols-2 lg:grid-cols-5">
                {/* Brand information */}
                <div>
                    <Link href="/" className="inline-block">
                        <Image
                            src="/images/logoo-flexx-dark.svg"
                            alt="Flexx logo"
                            width={140}
                            height={50}
                            className="h-10 w-auto object-contain"
                        />
                    </Link>

                    <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
                        Premium protein nutrition designed to fuel your training, recovery,
                        and everyday performance.
                    </p>

                    <div className="mt-6 flex gap-3">
                        <SocialLink href="#" label="Instagram">
                            <FaInstagram className="size-4" />
                        </SocialLink>

                        <SocialLink href="#" label="Facebook">
                            <FaFacebookF className="size-4" />
                        </SocialLink>

                        <SocialLink href="#" label="YouTube">
                            <FaYoutube className="size-4" />
                        </SocialLink>
                    </div>
                </div>

                {/* Navigation */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                        Explore
                    </h3>

                    <nav className="mt-5 flex flex-col gap-3 text-sm text-white/60">
                        <Link href="/products" className="transition hover:text-white">
                            Products
                        </Link>

                        <Link href="/#new-flavour" className="transition hover:text-white">
                            New Flavour
                        </Link>

                        <Link href="/#reviews" className="transition hover:text-white">
                            Reviews
                        </Link>

                        <Link href="/#faqs" className="transition hover:text-white">
                            FAQs
                        </Link>
                    </nav>
                </div>

                {/* Support */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                        Support
                    </h3>

                    <nav className="mt-5 flex flex-col gap-3 text-sm text-white/60">
                        <Link href="/track-order" className="transition hover:text-white">
                            Track order
                        </Link>

                        <Link href="#" className="transition hover:text-white">
                            Customer support
                        </Link>

                        <Link href="#" className="transition hover:text-white">
                            Shipping & delivery
                        </Link>

                        <Link href="#" className="transition hover:text-white">
                            Returns & refunds
                        </Link>

                        <Link href="/#faqs" className="transition hover:text-white">
                            Help center
                        </Link>
                    </nav>
                </div>

                {/* Contact information */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                        Contact
                    </h3>

                    <p className="mt-5 text-sm leading-6 text-white/60">
                        Have questions about Flexx products or your order?
                    </p>

                    <a
                        href="mailto:hello@flexx.com"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold transition hover:text-[var(--brand-red)]"
                    >
                        hello@flexx.com
                        <ArrowUpRight className="size-4" />
                    </a>
                </div>

                {/* Contact form */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                        Stay connected
                    </h3>

                    <NewsletterForm />
                </div>
            </div>

            <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 Flexx. All rights reserved.</p>
                <p>Fuel your potential.</p>
            </div>
        </footer>
    );
}

function SocialLink({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            aria-label={label}
            className="flex size-9 items-center justify-center border border-white/15 transition hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]"
        >
            {children}
        </a>
    );
}