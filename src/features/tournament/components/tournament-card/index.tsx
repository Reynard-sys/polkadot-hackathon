import { Calendar, Trophy, Users } from "lucide-react";
import SvgButton from "@/components/svg-button"


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

    const isUpcoming = status === "UPCOMING";

    const handleButtonClick = () => {
        if (!isUpcoming && onViewRankings) {
            onViewRankings();
        }

    };

    return (
        <div className="bg-[#151932] rounded-2xl p-6 pl-4 lg:pl-10 shadow-md border border-[#040825]">
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
    );
}  