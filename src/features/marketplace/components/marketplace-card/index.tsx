"use client";
import Image from "next/image";

interface MarketplaceCardProps {
    CardName: string;
    CardInfo: string;
    CardOwner: string;
    CardPrice: string;
    CardPriceChange?: string;
    CardPriceChangePositive?: boolean;
    CardImage?: string;
    onBuy?: () => void;
}

function CardButton({
    label,
    onClick,
    variant = "buy",
}: {
    label: string;
    onClick?: () => void;
    variant?: "buy" | "sell";
}) {
    return (
        <button
            onClick={onClick}
            className="relative inline-flex items-center justify-center group focus:outline-none cursor-pointer"
            aria-label={label}
        >
            <Image
                src="/assets/inventory/sell-button-union.svg"
                alt=""
                width={100}
                height={60}
                className=""
                aria-hidden="true"
            />

            <span className="absolute inset-0 flex items-center justify-center z-10 text-white text-xs font-bold tracking-wide select-none pb-2">
                {label}
            </span>
        </button>
    );
}

export default function MarketplaceCard({
    CardName,
    CardInfo,
    CardOwner,
    CardPrice,
    CardPriceChange = "↑4.1%",
    CardPriceChangePositive = true,
    CardImage,
    onBuy,
}: MarketplaceCardProps) {
    return (
        <div className="flex items-stretch w-100 lg:w-auto gap-5 bg-[linear-gradient(to_bottom,#2D3548_8%,#030A30_100%)]
                        border border-[#1e3a6e]/60 rounded-xl px-4 py-3 hover:border-[#3B82F6]/40
                        transition-all duration-200 group">
            {/* Card Image */}
            <div className="w-31 shrink-0 rounded-lg bg-[#1A1F2E] flex items-center justify-center overflow-hidden relative">
                {CardImage ? (
                    <Image src={CardImage} alt={CardName} fill className="object-cover" draggable="false"/>
                ) : (
                    <span className="text-[#3B82F6]/40 text-[10px] text-center leading-tight px-1">No Image</span>
                )}
            </div>

            {/* Card Info */}
            <div className="flex flex-col w-full justify-between py-1">
                <div>
                    <div>
                        <p className="text-white font-bold text-lg truncate">{CardName}</p>
                        <p className="text-white/50 text-sm truncate bg">{CardInfo}</p>
                        <p className="text-white/50 text-sm">by {CardOwner}</p>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:w-full lg:justify-between pt-3 lg:pt-0">
                        <div className="flex items-center gap-3 lg:mt-15">
                            <span className="text-white font-bold text-2xl">{CardPrice} </span>
                            <span className="font-normal text-xs mt-2">WND</span>
                            <span className={`text-xs mt-2 ${CardPriceChangePositive ? "text-green-400" : "text-red-400"}`}>
                                {CardPriceChange}
                            </span>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-2 lg:mt-10">
                            <CardButton label="Buy" onClick={onBuy} variant="buy" />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}