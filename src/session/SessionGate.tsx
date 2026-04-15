import { FormEvent, PropsWithChildren, useEffect, useState } from "react";
import { useSession } from "./sessionStore";

export function SessionGate({ children }: PropsWithChildren) {
  const session = useSession();
  const { isAuthenticated, selectPlayer, selectedPlayerId } = session;
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const lastSelectedPlayerId = window.localStorage.getItem("lowhofer.lastSelectedPlayerId");

    if (isAuthenticated && !selectedPlayerId && lastSelectedPlayerId) {
      void selectPlayer(lastSelectedPlayerId).catch(() => {
        window.localStorage.removeItem("lowhofer.lastSelectedPlayerId");
      });
    }
  }, [isAuthenticated, selectPlayer, selectedPlayerId]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await session.login(password);
      setPassword("");
    } catch {
      setError("Das Team-Passwort passt nicht.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session.isLoading) {
    return <FullPageMessage title="Lade Session..." text="Einen Moment." />;
  }

  if (!session.isAuthenticated) {
    return (
      <AuthShell eyebrow="Lowhofer" title="Team-Passwort">
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            className="input input-bordered min-h-12 w-full rounded-lg"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Team-Passwort"
            type="password"
            value={password}
          />
          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          <button className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900" disabled={isSubmitting}>
            Einloggen
          </button>
        </form>
      </AuthShell>
    );
  }

  if (!session.selectedPlayerId) {
    return (
      <AuthShell eyebrow="Spielerwahl" title="Wer bist du?">
        <PlayerSelection />
      </AuthShell>
    );
  }

  return children;
}

function PlayerSelection() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);

  async function selectPlayer(playerId: string) {
    setError(null);

    try {
      await session.selectPlayer(playerId);
    } catch {
      setError("Dieser Spieler konnte nicht ausgewählt werden.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {session.players.map((player) => (
          <button
            className="min-h-12 rounded-lg bg-base-200 px-4 text-left font-bold text-petrol-900 hover:bg-base-300"
            key={player.id}
            onClick={() => selectPlayer(player.id)}
            type="button"
          >
            {player.name}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
      <button className="btn btn-ghost min-h-11 w-full rounded-lg" onClick={() => session.logout()} type="button">
        Abmelden
      </button>
    </div>
  );
}

function AuthShell({ children, eyebrow, title }: PropsWithChildren<{ eyebrow: string; title: string }>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-3 py-8 text-base-content">
      <section className="w-full max-w-md rounded-lg border border-primary/15 bg-base-100 p-5 shadow-sm">
        <p className="text-sm font-black uppercase text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black text-petrol-900">{title}</h1>
        <div className="mt-5">{children}</div>
      </section>
    </main>
  );
}

function FullPageMessage({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-3 text-base-content">
      <section className="w-full max-w-md rounded-lg border border-primary/15 bg-base-100 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-petrol-900">{title}</h1>
        <p className="mt-2 text-base-content/70">{text}</p>
      </section>
    </main>
  );
}
