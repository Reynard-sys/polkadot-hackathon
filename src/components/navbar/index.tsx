import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Deck", href: "/deck" },
        { name: "Gacha", href: "/gacha" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Tournament", href: "/tournament" },
    ];

    return (
        <nav className=" fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-b from-[#2d3548] to-[#030a30]">
            <div className="px-6 lg:px-8 flex items-center justify-between">
                {/* Left Side: Profile */}
                <div className="flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 bg-[#8C8C8C] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                            src="/assets/profile-picture.png"
                            alt="Profile Avatar"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-white font-bold text-[17px] tracking-wide hidden sm:block">
                        Lorem Ipsum
                    </span>
                </div>

                {/* Center: Navigation Links */}
                <div className="hidden lg:flex items-center gap-8 xl:gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-white hover:text-white/80 font-bold text-[15px] xl:text-[16px] transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right Side: Wallet & Menu */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <button className="cursor-pointer relative transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
                        <Image
                            src="/assets/connect-wallet-btn.svg"
                            alt="Connect Wallet"
                            width={181}
                            height={46}
                            className="w-full h-full"
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
