"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavKind = "home" | "market" | "gacha" | "deck" | "tournament";

const NAV_ITEMS: { kind: NavKind; label: string; href: string }[] = [
    { kind: "home", label: "Home", href: "/" },
    { kind: "market", label: "Marketplace", href: "/marketplace" },
    { kind: "gacha", label: "Gacha", href: "/gacha" },
    { kind: "deck", label: "Deck", href: "/deck" },
    { kind: "tournament", label: "Tournament", href: "/tournament" },
];

function NavIcon({ kind, active }: { kind: NavKind; active: boolean }) {
    const cls = `h-6 w-6 ${active ? "text-white" : "text-white/70"}`;

    if (kind === "home") {
        return (
            <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5.5 9.5V21h13V9.5" />
            </svg>
        );
    }

    if (kind === "market") {
        return (
            <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 4h2l2.4 11.5h10.7L21 7H7" />
                <circle cx="10" cy="19" r="1.4" />
                <circle cx="17" cy="19" r="1.4" />
            </svg>
        );
    }

    if (kind === "gacha") {
        return (
            <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="8" width="16" height="10" rx="2.5" />
                <circle cx="9" cy="13" r="1.5" />
                <circle cx="15" cy="13" r="1.5" />
                <path d="M12 8V6" />
            </svg>
        );
    }

    if (kind === "deck") {
        return (
            <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="4" width="14" height="16" rx="1.5" />
                <path d="M8 8h8M8 12h8M8 16h8" />
            </svg>
        );
    }

    // tournament
    return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 4h12v4c0 3.5-2.7 5.6-6 6-3.3-.4-6-2.5-6-6V4z" />
            <path d="M12 14v6" />
            <path d="M8.5 20h7" />
        </svg>
    );
}

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/30 bg-[#272727] md:hidden">
            <ul className="mx-auto grid max-w-md grid-cols-5 px-2 py-2 text-[12px]">
                {NAV_ITEMS.map(({ kind, label, href }) => {
                    const active = pathname === href;
                    return (
                        <li key={kind}>
                            <Link
                                href={href}
                                className={`flex flex-col items-center justify-center gap-1 py-1 ${active ? "text-white" : "text-white/70"}`}
                            >
                                <NavIcon kind={kind} active={active} />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
