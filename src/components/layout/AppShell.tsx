import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { fetchLeagueSource } from "../../api/plannerApi";
import { PlayerAvatar } from "../players/PlayerAvatar";
import { isTrainingMemberRole } from "../../domain/playerRoles";
import { SessionGate } from "../../session/SessionGate";
import { useSession } from "../../session/sessionStore";
import { usePlanner } from "../../state/plannerStore";
import { OxUpdatesButton } from "../header/OxUpdatesButton";

const navigationItems = [
  { to: "/", label: "Spieltage", end: true },
  { to: "/table", label: "Tabelle", end: false },
  { to: "/players", label: "Spieler", end: false },
];

const audioPath = "/audio/ochsnfetzn.mp3";

export function AppShell() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const [isOxShaking, setIsOxShaking] = useState(false);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioPath);
      audioRef.current.volume = 0.8;
    }

    return audioRef.current;
  }

  function triggerOxShake() {
    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }

    setIsOxShaking(false);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsOxShaking(true);
      shakeTimeoutRef.current = window.setTimeout(() => {
        setIsOxShaking(false);
        shakeTimeoutRef.current = null;
      }, 450);
    }, 0);
  }

  function handleBannerClick() {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch((error: unknown) => {
      console.error("OchsnFetzn audio playback failed", error);
    });

    triggerOxShake();
  }

  return (
    <SessionGate>
      <div className="min-h-screen bg-base-200 text-base-content">
        <header className="border-b-4 border-secondary bg-petrol-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-col px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-3">
              <OxUpdatesButton isShaking={isOxShaking} />
              <div className="flex flex-1 items-center justify-between gap-3">
                <button
                  className="flex flex-col rounded-lg border-0 bg-secondary px-3 py-1 text-left shadow-[4px_4px_0_0_rgba(255,255,255,0.16)] transition-transform hover:scale-[1.01] active:scale-[0.99] sm:px-4 sm:py-1.5"
                  onClick={handleBannerClick}
                  title="OchsnFetzn"
                  type="button"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-petrol-900/60 sm:text-xs">
                    Lowhofer
                  </span>
                  <p className="text-lg font-black uppercase leading-none text-petrol-900 sm:text-2xl">
                    Let the Ox fetz!
                  </p>
                </button>
                <LeagueSiteLink />
              </div>
            </div>
            <div className="mt-3 border-y border-white/15 py-2">
              <SessionControls />
            </div>
            <nav className="mt-3 grid grid-cols-3 gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-black transition sm:min-h-12 sm:text-base ${
                      isActive
                        ? "border-secondary bg-secondary text-petrol-900"
                        : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                    }`
                  }
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
          <Outlet />
        </main>
      </div>
    </SessionGate>
  );
}

function LeagueSiteLink() {
  const [leagueUrl, setLeagueUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagueSource()
      .then((settings) => setLeagueUrl(settings.leagueBaseUrl))
      .catch(() => {});
  }, []);

  if (!leagueUrl) {
    return null;
  }

  return (
    <a
      className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
      href={leagueUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      Liga
    </a>
  );
}

function SessionControls() {
  const session = useSession();
  const { players } = usePlanner();
  const selectedPlayer = players.find((player) => player.id === session.selectedPlayerId);
  const isTrainingMember = isTrainingMemberRole(session.selectedPlayerRole ?? undefined);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        {selectedPlayer ? <PlayerAvatar className="ring-white/20" player={selectedPlayer} size="sm" /> : null}
        <div className="min-w-0">
          <span className="font-semibold uppercase tracking-wide text-neon">
            {isTrainingMember ? "Zugang" : "Spieler"}
          </span>
          <span className="ml-2 font-black text-white">{session.selectedPlayerDisplayName}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          className="btn btn-xs min-h-8 rounded-lg border-white/20 bg-white/10 px-2.5 text-white hover:bg-white/20"
          onClick={session.logout}
          type="button"
        >
          Das bin ich nicht
        </button>
      </div>
    </div>
  );
}
