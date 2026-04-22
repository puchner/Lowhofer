export type AppUpdate = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category?: "feature" | "improvement" | "fix";
};

export const appUpdates: AppUpdate[] = [
    {
    id: "2026-04-14-appointments",
    title: "Termine im Blick",
    description: "Neue Termine anlegen und Rückmeldungen jetzt direkt mit optionaler Notiz erfassen.",
    publishedAt: "2026-04-14T00:00:00.000Z",
    category: "feature",
  },
  {
    id: "2026-04-15-profile-edit",
    title: "Profil selbst pflegen",
    description: "Dein Profil kannst du jetzt jederzeit selbst bearbeiten.",
    publishedAt: "2026-04-15T00:00:00.000Z",
    category: "feature",
  },
  {
    id: "2026-04-16-banner-surprise",
    title: "Mehr Leben im Ox",
    description: "Beim grünen Banner lohnt sich jetzt ein Klick.",
    publishedAt: "2026-04-16T00:00:00.000Z",
    category: "improvement",
  },
  {
    id: "2026-04-16-news-feed",
    title: "News Feed",
    description: "Neue Funktionen und Verbesserungen findest du jetzt gesammelt direkt beim Ochsen.",
    publishedAt: "2026-04-16T00:00:00.000Z",
    category: "feature",
  },
  {
    id: "2026-04-16-lowhofer-read-only",
    title: "Alle Lowhofer an Bord",
    description: "Mit dem gemeinsamen Lowhofer-Zugang bleiben auch Mitleser bei Terminen, Tabelle, Spielern und News auf dem Laufenden.",
    publishedAt: "2026-04-16T12:00:00.000Z",
    category: "feature",
  },
  {
    id: "2026-04-22-calendar-and-match-model",
    title: "Kalender-Abo",
    description: "Spieltage koennen jetzt mit dem privaten Kalender synchronisiert werden.",
    publishedAt: "2026-04-22T00:00:00.000Z",
    category: "feature",
  }
];
