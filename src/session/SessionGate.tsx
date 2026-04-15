import { Eye, EyeOff } from "lucide-react";
import { FormEvent, PropsWithChildren, useMemo, useState } from "react";
import { useSession } from "./sessionStore";

export function SessionGate({ children }: PropsWithChildren) {
  const session = useSession();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(() => {
    return window.localStorage.getItem("lowhofer.lastSelectedPlayerId") ?? "";
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolvedSelectedPlayerId = useMemo(() => {
    if (session.players.some((player) => player.id === selectedPlayerId)) {
      return selectedPlayerId;
    }

    return session.players[0]?.id ?? "";
  }, [selectedPlayerId, session.players]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await session.login(password, resolvedSelectedPlayerId);
      setPassword("");
    } catch {
      setError("Spieler oder Team-Passwort passt nicht.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session.isLoading) {
    return <FullPageMessage title="Lade Session..." text="Einen Moment." />;
  }

  if (!session.isAuthenticated || !session.selectedPlayerId) {
    return (
      <AuthShell eyebrow="Lowhofer" title="Wer bist du?">
        <form className="space-y-4" onSubmit={handleLogin}>
          <select
            className="select select-bordered min-h-12 w-full rounded-lg"
            disabled={session.players.length === 0}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
            value={resolvedSelectedPlayerId}
          >
            {session.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              className="input input-bordered min-h-12 w-full rounded-lg pr-12"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Team-Passwort"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-base-content/50 hover:text-base-content"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? "Verbergen" : "Anzeigen"}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Eye aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          <button
            className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900"
            disabled={isSubmitting || !resolvedSelectedPlayerId}
          >
            Einloggen
          </button>
        </form>
      </AuthShell>
    );
  }

  return children;
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
