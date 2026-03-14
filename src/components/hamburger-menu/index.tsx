"use client";

import Image from "next/image";
import Link from "next/link";

type MenuItem = {
    label: string;
    href?: string;
};

const MOBILE_MENU_ITEMS: MenuItem[] = [
    { label: "Inventory", href: "/inventory" },
    { label: "Profile" },
    { label: "Settings" },
];

const DESKTOP_MENU_ITEMS: MenuItem[] = [
    { label: "Inventory", href: "/inventory" },
    { label: "Settings" },
    { label: "Profile" },
];

function MenuLabel({
    label,
    href,
    onClick,
    className,
}: {
    label: string;
    href?: string;
    onClick?: () => void;
    className: string;
}) {
    if (href) {
        return (
            <Link href={href} onClick={onClick} className={className}>
                {label}
            </Link>
        );
    }

    return (
        <button type="button" className={className}>
            {label}
        </button>
    );
}

export function MobileHamburgerMenu({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[95] lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0"
                aria-label="Close menu"
            />
            <div className="absolute right-0 top-0 flex h-[100svh] w-[248px] flex-col items-center rounded-bl-[8px] rounded-tl-[8px] border-l border-[#c8cad4] bg-[#272727] px-6 pt-[39px]">
                <Image
                    src="/logo.svg"
                    alt="AniVerse Nexus"
                    width={145}
                    height={53}
                    className="h-auto w-[145.181px] shrink-0"
                    priority
                />
                <div className="mt-[47.706px] flex flex-col items-center gap-6">
                    {MOBILE_MENU_ITEMS.map((item) => (
                        <MenuLabel
                            key={item.label}
                            label={item.label}
                            href={item.href}
                            onClick={item.href ? onClose : undefined}
                            className="flex h-[38px] w-[251px] items-center justify-center text-center text-[16px] leading-6 font-normal text-white/80"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DesktopHamburgerMenu({ onClose }: { onClose: () => void }) {
    return (
        <div className="absolute right-0 top-[calc(100%+34px)] z-[80] flex h-[210px] w-[299px] flex-col items-center gap-6 rounded-[8px] border border-[#1f2540] bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] p-6">
            {DESKTOP_MENU_ITEMS.map((item) => (
                <MenuLabel
                    key={item.label}
                    label={item.label}
                    href={item.href}
                    onClick={item.href ? onClose : undefined}
                    className="flex h-[38px] w-[251px] items-center justify-center text-center text-[18px] leading-[27px] font-bold text-white/80"
                />
            ))}
        </div>
    );
}
