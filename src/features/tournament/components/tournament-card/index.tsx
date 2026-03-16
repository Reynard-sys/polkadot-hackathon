import { useState } from "react";
import Image from "next/image";
import { Calendar, Trophy, Users } from "lucide-react";
import SvgButton from "@/components/svg-button";

interface TournamentCardProps {
    title: string;
    date: string;
    prizePool: string;
    participants: string;
    status: "UPCOMING" | "PAST";
    onViewRankings?: () => void;
}

export default function TournamentCard({
    title,
    date,
    prizePool,
    participants,
    status,
    onViewRankings,
}: TournamentCardProps) {
    // state to control modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isUpcoming = status === "UPCOMING";

    // click handle for join tournaments
    const handleButtonClick = () => {
        if (isUpcoming) {
            setIsModalOpen(true);
        } else if (!isUpcoming && onViewRankings) {
            onViewRankings();
        }
    };

    // closing of modal
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <div className="bg-[#151932] rounded-2xl p-6 pl-4 mt-4 lg:mt-5 lg:pl-10 shadow-md border border-[#040825]">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg lg:text-3xl font-bold text-white">{title}</h2>
                    <span
                        className={`text-xs lg:text-sm font-bold px-4 py-2 rounded-2xl tracking-wider ${
                            isUpcoming
                                ? "bg-green-500 text-white"
                                : "bg-[#3A3C4A] text-gray-300"
                        }`}
                    >
                        {status}
                    </span>
                </div>

                {/* Date */}
                <div className="flex items-center text-gray-400 text-md lg:text-lg mb-4">
                    <Calendar size={14} className="mr-2" />
                    <span>{date}</span>
                </div>

                {/* Prize & Participants */}
                <div className="flex justify-between lg:gap-120 mb-5">
                    <div>
                        <div className="flex items-center text-gray-400 text-sm mb-1">
                            <Trophy size={18} className="mr-1 text-yellow-400" />
                            <span>Prize Pool</span>
                        </div>
                        <div className="text-right justify-end whitespace-nowrap font-bold text-lg lg:text-xl pl-5 text-white">
                            {prizePool}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center text-gray-400 text-sm mb-1">
                            <Users size={18} className="mr-1 text-blue-400" />
                            <span>Participants</span>
                        </div>
                        <div className="text-right justify-end font-bold text-lg lg:text-xl text-white">
                            {participants}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <SvgButton
                    onClick={handleButtonClick}
                    className="w-full h-[80px]"
                >
                    {isUpcoming ? "Join Tournament" : "View Rankings"}
                </SvgButton>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={closeModal}
                >
                    {/* Modal Content Container */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm"
                    >
                        {/* Optional Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-white/60 hover:text-white z-10 cursor-pointer"
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div className="flex flex-col items-center justify-center bg-[linear-gradient(to_top,#120C35_8%,#143C87_45%,#13245E_98%)] rounded-2xl border border-[#8085BD] py-16 px-8 space-y-3 text-center">
                            <div>
                                <Image
                                    src="/assets/tournament-page/upcoming.svg"
                                    alt=""
                                    width={100}
                                    height={120}
                                    className="max-w-sm pointer-events-none"
                                    aria-hidden="true"
                                />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Upcoming</h3>
                            <p className="text-white/50 text-sm">Stay tuned for this feature</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}