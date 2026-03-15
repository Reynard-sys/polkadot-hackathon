"use client";
import SvgButton from "@/components/svg-button";
import { useState } from "react";
import Image from "next/image";
import { Flame, Users } from "lucide-react";

// Upcoming Feature Modal

function UpcomingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-gradient-to-b from-[#0e1e4a] to-[#0a1228] border border-[#1e3a6e] rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#1A56DB]/20 border border-[#1A56DB]/40 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect
              x="4"
              y="4"
              width="11"
              height="11"
              rx="2"
              stroke="white"
              strokeWidth="1.5"
            />
            <rect
              x="17"
              y="4"
              width="11"
              height="11"
              rx="2"
              stroke="white"
              strokeWidth="1.5"
            />
            <rect
              x="4"
              y="17"
              width="11"
              height="11"
              rx="2"
              stroke="white"
              strokeWidth="1.5"
            />
            <rect
              x="17"
              y="17"
              width="11"
              height="11"
              rx="2"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <h2 className="text-white font-bold text-xl">Upcoming Feature</h2>
        <p className="text-[#8a9fc8] text-sm leading-relaxed">
          Buying cards is coming soon! Stay tuned for updates.
        </p>
        <SvgButton onClick={onClose} className="w-full h-[60px] mt-2">
          Go back
        </SvgButton>
      </div>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: "bg-yellow-500 text-black",
  Rare: "bg-blue-500 text-white",
  Common: "bg-gray-500 text-white",
  Mythic: "bg-purple-500 text-white",
};

function BuyConfirmButton({ onDone }: { onDone: () => void }) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  return (
    <>
      <SvgButton
        onClick={() => setShowUpcoming(true)}
        className="w-full h-[60px]"
      >
        Buy
      </SvgButton>

      {showUpcoming && (
        <UpcomingModal
          onClose={() => {
            setShowUpcoming(false);
            onDone();
          }}
        />
      )}
    </>
  );
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: {
    name: string;
    info: string;
    rarity?: string;
    set?: string;
    description?: string;
    image?: string;
  };
}

export default function BuyModal({ isOpen, onClose, card }: SellModalProps) {
  if (!isOpen) return null;
  const rarity = card?.rarity || "Legendary";
  const rarityClass = RARITY_COLORS[rarity] || "bg-yellow-500 text-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-10 pb-15 overflow-y-scroll">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative z-10 bg-transparent lg:bg-[#151932] rounded-2xl p-8 px-10 pt-15 mt-20 max-w-3xl w-full shadow-2xl flex flex-col md:flex-row gap-6 ">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white/10  flex items-center justify-center text-white hover:bg-[#1e3a6e] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Card Preview */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-auto h-80 lg:h-100 rounded-xl overflow-hidden shadow-lg">
            {card?.image ? (
              <Image
                src={card.image}
                alt={card.name || "Card"}
                width={200}
                height={300}
                className="object-cover w-full h-full"
                draggable="false"
              />
            ) : (
              <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a3a8c] to-[#0d2060] p-3 gap-2">
                <div className="flex justify-between items-center">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xs">
                    1
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#1A56DB]/40 border border-blue-400/30" />
                </div>
                <div className="flex-1 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                  <span className="text-white/30 text-[10px]">Card Art</span>
                </div>
                <div className="bg-[#0a1a4a]/80 rounded-lg p-2">
                  <p className="text-yellow-300 font-bold text-xs text-center">
                    {card?.name || "Lorem Ipsum"}
                  </p>
                  <p className="text-white/50 text-[9px] text-center truncate">
                    Lorem ipsum dolor amet
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">
                {card?.name || "Card title"}
              </h2>
              <p className="text-[#8a9fc8] text-sm">
                {card?.info || "[Card Info]"}
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${rarityClass}`}
            >
              {rarity}
            </span>
          </div>

          <div>
            <div className="flex items-center text-[#8a9fc8] text-xs">
              <Users size={15} className="mr-1 text-[#99A1AF]" />
              Set
            </div>
            <p className="text-white text-sm mt-0.5">
              {card?.set || "One Piece Pack"}
            </p>
          </div>

          <div>
            <div className="flex items-center text-[#99A1AF] text-xs">
              <Flame size={15} className="mr-1 text-[#99A1AF]" />
              Card Info
            </div>
            <p className="text-white text-sm mt-0.5">
              {card?.info || "[Card Info]"}
            </p>
          </div>

          <div className="bg-[#0F1329] border border-[#1e3a6e]/40 rounded-xl p-4 h-40">
            <p className="text-white font-semibold text-sm mb-2">Description</p>
            <p className="text-[#8a9fc8] text-xs leading-relaxed">
              {card?.description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Image
              src="/assets/inventory/web/filter-separator.svg"
              alt="Separator"
              width={200}
              height={10}
              className="w-full h-auto pointer-events-none"
              aria-hidden="true"
              draggable="false"
            />
          </div>

          <BuyConfirmButton onDone={onClose} />
        </div>
      </div>
    </div>
  );
}
