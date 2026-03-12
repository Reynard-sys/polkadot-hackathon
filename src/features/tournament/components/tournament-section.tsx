import { useState } from "react";
import Image from "next/image";
import TournamentCard from "./tournament-card";
import RankingsPage from "./rankings";

// Mock data array
export const TOURNAMENTS = [
  {
    id: 1,
    title: "Summer Championship",
    date: "2026-02-22 • 18:00 PM",
    prizePool: "PHP 50,000",
    participants: "124/256",
    status: "UPCOMING" as const,
  },
  {
    id: 2,
    title: "Yearly Championship",
    date: "2026-02-30 • 18:00 PM",
    prizePool: "PHP 150,000",
    participants: "127/256",
    status: "UPCOMING" as const,
  },
  {
    id: 3,
    title: "Weekly Brawl",
    date: "2026-02-15 • 18:00 PM",
    prizePool: "PHP 10,000",
    participants: "256/256",
    status: "PAST" as const,
  },
  {
    id: 4,
    title: "Daily Brawl",
    date: "2026-02-15 • 18:00 PM",
    prizePool: "PHP 10,000",
    participants: "256/256",
    status: "PAST" as const,
  },
];

const TABS = ["Online Tournaments", "Onsite Events", "Practice"];

export default function TournamentFeature() {
  const [activeTab, setActiveTab] = useState("Online Tournaments");

  const [viewingRankingsFor, setViewingRankingsFor] = useState<number | null>(
    null,
  );

  if (viewingRankingsFor !== null) {
    return (
      <RankingsPage
        tournamentId={viewingRankingsFor}
        onBack={() => setViewingRankingsFor(null)}
      />
    );
  }

  return (
    <div className="bg-transparent font-sans py-10">
      {/* Mobile Banner */}
      <div className="lg:hidden relative w-full p-4 pt-18">
        <Image
          src="/assets/tournament-page/tournament.svg"
          alt="Tournament"
          width={350}
          height={78}
          className="w-full h-auto pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-transparent pt-30 pb-0 w-full">
        <h1 className="text-7xl font-bold text-white text-center mb-4">
          Tournament
        </h1>
        <p className="text-center text-gray-400 text-sm max-w-xl mx-auto mb-8">
          Lorem ipsum dolor sit amet consectetur. Vitus vitae augue risus
          phasellus sagittis in eros eget consectetur.
        </p>
        <div className="w-full overflow-hidden">
          <Image
            src="/assets/tournament-page/outline.svg"
            alt=""
            width={1600}
            height={120}
            className="max-w-4xl lg:max-w-4xl xl:max-w-7xl pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 pb-2 lg:p-0 lg:py-12">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-2 lg:gap-5 w-full bg-gradient-to-b from-[#0144BD] to-[#192871] rounded-2xl p-2 mb-3 lg:mb-8 lg:max-w-6xl lg:mx-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const isWide = tab === "Online Tournaments";
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                                    ${isWide ? "col-span-2" : "col-span-1"}
                                    lg:py-3 text-sm lg:text-lg font-bold rounded-xl
                                    transition-all duration-300
                                    ${
                                      isActive
                                        ? "bg-white text-[#0f2d71] shadow-md mx-1 md:mx-2 lg:mx-7"
                                        : "text-white/80 hover:text-white hover:bg-white/10"
                                    }
                                `}
              >
                {tab === "Online Tournaments" ? (
                  <>
                    <span className="lg:hidden">
                      Online
                      <br />
                      Tournaments
                    </span>
                    <span className="hidden lg:inline">Online Tournaments</span>
                  </>
                ) : tab === "Onsite Events" ? (
                  <>
                    <span className="lg:hidden">
                      Onsite
                      <br />
                      Events
                    </span>
                    <span className="hidden lg:inline">Onsite Events</span>
                  </>
                ) : (
                  tab
                )}
              </button>
            );
          })}
        </div>

        {/* Cards or Empty State */}
        {activeTab === "Online Tournaments" ? (
          <div className="flex flex-col space-y-3 lg:space-y-6 lg:max-w-6xl lg:mx-auto">
            {TOURNAMENTS.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                title={tournament.title}
                date={tournament.date}
                prizePool={tournament.prizePool}
                participants={tournament.participants}
                status={tournament.status}
                onViewRankings={() => setViewingRankingsFor(tournament.id)}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center
                                    bg-[linear-gradient(to_top,#120C35_8%,#143C87_45%,#13245E_98%)]
                                    rounded-2xl border border-[#8085BD] py-16 px-8 space-y-3 text-center"
          >
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
        )}
      </div>
    </div>
  );
}
