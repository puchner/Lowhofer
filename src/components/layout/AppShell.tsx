import { NavLink, Outlet } from "react-router-dom";
import { SessionGate } from "../../session/SessionGate";
import { useSession } from "../../session/sessionStore";
import { OxHeadMark } from "../branding/OxHeadMark";

const navigationItems = [
  { to: "/", label: "Spieltage", end: true },
  { to: "/table", label: "Tabelle", end: false },
  { to: "/players", label: "Spieler", end: false },
];

export function AppShell() {
  return (
    <SessionGate>
      <div className="min-h-screen bg-base-200 text-base-content">
        <header className="border-b-4 border-secondary bg-petrol-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neon sm:text-sm">Lowhofer</p>
                </div>
                <div className="flex items-center gap-3">
                  <OxHeadMark />
                  <p className="inline-flex rounded-lg bg-secondary px-3 py-2 text-xl font-black uppercase leading-tight text-petrol-900 shadow-[5px_5px_0_0_rgba(255,255,255,0.18)] sm:px-4 sm:text-4xl">
                    Let the Ox fetz!
                  </p>
                </div>
              </div>
              <SessionControls />
            </div>
            <nav className="grid grid-cols-3 gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-16 items-center justify-center rounded-lg border px-3 text-sm font-black transition sm:min-h-20 sm:min-w-28 sm:text-base ${
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

function SessionControls() {
  const session = useSession();

  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neon">Aktiver Spieler</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="rounded-lg bg-white px-3 py-2 text-sm font-black text-petrol-900">
          {session.selectedPlayerDisplayName}
        </p>
        <button
          className="btn btn-sm min-h-10 rounded-lg border-white/15 bg-white/10 text-white"
          onClick={session.logout}
          type="button"
        >
          Ich bin nicht {session.selectedPlayerDisplayName}
        </button>
      </div>
      {session.selectedPlayerIsAdmin ? <p className="mt-2 text-xs font-semibold text-secondary">Admin</p> : null}
    </div>
  );
}
