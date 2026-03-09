"use client";

import Image from "next/image";
import Link from "next/link";

function BrandLogo() {
    return (
        <div className="h-[44px] shrink-0">
            <Image
                src="/assets/brand/aniverse-nexus.png"
                alt="Aniverse Nexus"
                width={280}
                height={111}
                className="h-[44px] w-auto object-contain"
                priority
            />
        </div>
    );
}

export default function Navbar() {
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Deck", href: "/deck" },
        { name: "Gacha", href: "/gacha" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Tournament", href: "/tournament" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-linear-to-b from-[#2d3548] to-[#030a30]">
            <div className="px-6 lg:px-8 py-3 flex justify-between items-center">
                {/* Left Side: Brand Logo */}
                <Link href="/" className="block" aria-label="Aniverse Nexus">
                    <BrandLogo />
                </Link>

                {/* Center: Navigation Links */}
                <div className="hidden lg:flex justify-center items-center gap-8 xl:gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-white hover:text-white/80 font-bold text-lg leading-7 transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right Side: Wallet & Menu */}
                <div className="flex gap-3 sm:gap-6">
                    <button className="cursor-pointer relative transition-transform hover:scale-105 active:scale-95">
                        <Image
                            src="/assets/connect-wallet-btn.svg"
                            alt="Connect Wallet"
                            width={181}
                            height={46}
                            className="w-full"
                            priority
                        />
                    </button>
                    <button className="cursor-pointer text-white shrink-0">
                        <Image
                            src="/assets/hamburger-btn.svg"
                            alt="Menu"
                            width={37}
                            height={37}
                            className="w-full h-full"
                        />
                    </button>
                </div>

            </div>
        </nav>
    );
}
