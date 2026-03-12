import { useState } from "react";
import { Undo2, Medal } from "lucide-react";

export interface RankingPlayer {
    rank: number;
    username: string;
    info: string;
    countryCode?: string;
    points: number;
}

interface TournamentRankingsData {
    tournamentId: number;
    tournamentTitle: string;
    global: RankingPlayer[];
    local: RankingPlayer[];
}

export const MOCK_RANKINGS: Record<number, TournamentRankingsData> = {
    3: {
        tournamentId: 3,
        tournamentTitle: "Weekly Brawl",
        global: [
            { rank: 1, username: "ShadowStrike", info: "PH", countryCode: "PH", points: 4200 },
            { rank: 2, username: "NeonViper",    info: "US", countryCode: "US", points: 3980 },
            { rank: 3, username: "IronWolf",     info: "KR", countryCode: "KR", points: 3850 },
            { rank: 4, username: "FrostByte",    info: "JP", countryCode: "JP", points: 3720 },
            { rank: 5, username: "TurboAce",     info: "PH", countryCode: "PH", points: 3610 },
            { rank: 6, username: "RedPhantom",   info: "BR", countryCode: "BR", points: 3540 },
            { rank: 7, username: "CyberKnight",  info: "DE", countryCode: "DE", points: 3480 },
            { rank: 8, username: "BlazeFist",    info: "PH", countryCode: "PH", points: 3400 },
            { rank: 9, username: "StormRider",   info: "AU", countryCode: "AU", points: 3310 },
            { rank: 10, username: "VoidHunter",  info: "CA", countryCode: "CA", points: 3250 },
        ],
        local: [
            { rank: 1, username: "ShadowStrike", info: "Manila",   points: 4200 },
            { rank: 2, username: "TurboAce",     info: "Cebu",     points: 3610 },
            { rank: 3, username: "BlazeFist",    info: "Davao",    points: 3400 },
            { rank: 4, username: "NightOwl",     info: "Taguig",   points: 3200 },
            { rank: 5, username: "StarForge",    info: "QC",       points: 3100 },
            { rank: 6, username: "GhostBlade",   info: "Pasig",    points: 2980 },
            { rank: 7, username: "IceBreaker",   info: "Makati",   points: 2870 },
            { rank: 8, username: "DuskRaider",   info: "Mandaluyong", points: 2760 },
            { rank: 9, username: "SwiftArrow",   info: "Taguig",   points: 2640 },
            { rank: 10, username: "LightBringer",info: "Pasay",    points: 2500 },
        ],
    },
    4: {
        tournamentId: 4,
        tournamentTitle: "Daily Brawl",
        global: [
            { rank: 1, username: "PixelKing",   info: "PH", countryCode: "PH", points: 3900 },
            { rank: 2, username: "DarkMatter",  info: "SG", countryCode: "SG", points: 3750 },
            { rank: 3, username: "ApexPredator",info: "US", countryCode: "US", points: 3620 },
            { rank: 4, username: "CodeBreaker", info: "PH", countryCode: "PH", points: 3500 },
            { rank: 5, username: "NovaSurge",   info: "KR", countryCode: "KR", points: 3380 },
            { rank: 6, username: "WarpSpeed",   info: "JP", countryCode: "JP", points: 3250 },
            { rank: 7, username: "PrimeShot",   info: "PH", countryCode: "PH", points: 3100 },
            { rank: 8, username: "TitanFall",   info: "MX", countryCode: "MX", points: 2990 },
            { rank: 9, username: "EmberCore",   info: "AU", countryCode: "AU", points: 2870 },
            { rank: 10, username: "ZeroGrav",   info: "CA", countryCode: "CA", points: 2740 },
        ],
        local: [
            { rank: 1, username: "PixelKing",  info: "Taguig",  points: 3900 },
            { rank: 2, username: "CodeBreaker",info: "Manila",   points: 3500 },
            { rank: 3, username: "PrimeShot",  info: "QC",      points: 3100 },
            { rank: 4, username: "DawnRacer",  info: "Cebu",    points: 2800 },
            { rank: 5, username: "MeteorBolt", info: "Pasig",   points: 2650 },
        ],
    },
};

function RankBadge({ rank }: { rank: number }) {
    const gold   = "bg-[#F2D01C] text-black";
    const silver = "bg-[#A1A1A1] text-black";
    const bronze = "bg-[#BE6E34] text-black";
    const normal = "bg-[#DBDBDB] text-black";

    const cls = rank === 1 ? gold : rank === 2 ? silver : rank === 3 ? bronze : normal;

    return (
        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${cls}`}>
            {rank}
        </span>
    );
}

function PlayerRow({ player }: { player: RankingPlayer }) {
    return (
        <div className="flex items-center gap-3 bg-[#E8EAF6] rounded-xl px-4 py-3">
            <RankBadge rank={player.rank} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[#0f2040] font-bold text-sm truncate">{player.username}</span>
                    {player.countryCode && (
                        <span className="text-[10px] font-semibold text-[#0144BD] bg-[#dde6ff] px-1.5 py-0.5 rounded-md">
                            {player.countryCode}
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-[#5c6b8a] truncate">{player.info}</p>
            </div>
            <span className="text-[#0f2040] font-bold text-sm whitespace-nowrap">
                {player.points.toLocaleString()} pts
            </span>
        </div>
    );
}

interface RankingsPageProps {
    tournamentId: number;
    onBack: () => void;
}

export default function RankingsPage({ tournamentId, onBack }: RankingsPageProps) {
    const [activeTab, setActiveTab] = useState<"Global" | "Local">("Global");

    const data = MOCK_RANKINGS[tournamentId];

    if (!data) {
        return (
            <div className="min-h-screen bg-[#0b0e2a] flex items-center justify-center">
                <p className="text-white/50">No ranking data available.</p>
            </div>
        );
    }

    const players = activeTab === "Global" ? data.global : data.local;

    return (
        <div className="w-full lg:w-5/10 bg-transparent font-sans py-30 px-4">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-white font-medium hover:text-white transition-colors mb-6 text-sm cursor-pointer "
            >
                <Undo2 size={24} />
                Back
            </button>

            {/* Rankings Card */}
            <div className="max-w-lg mx-auto bg-[#1a1f3d] rounded-2xl border border-[#1e2450] overflow-hidden">

                {/* Card Header */}
                <div className="flex items-center justify-center gap-2 pt-6 pb-4 border-b border-[#1a1f3d]">
                    <Medal size={16} className="text-whitet" />
                    <h2 className="text-white font-bold text-base">Top Players</h2>
                </div>

                {/* Global / Local Toggle */}
                <div className="grid grid-cols-2 mx-4 mt-4 mb-4 bg-[#1a1f3d] rounded-xl p-1">
                    {(["Global", "Local"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 rounded-lg text-sm font-bold transition-all duration-200
                                ${activeTab === tab
                                    ? "bg-white text-[#0f2040] shadow"
                                    : "text-white/60 hover:text-white"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Player List */}
                <div className="flex flex-col gap-2 px-4 pb-6">
                    {players.length > 0 ? (
                        players.map((p) => <PlayerRow key={p.rank} player={p} />)
                    ) : (
                        <p className="text-center text-white/40 text-sm py-8">No data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}