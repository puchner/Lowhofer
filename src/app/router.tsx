import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { LeagueTablePage } from "../pages/LeagueTablePage";
import { MatchDayDetailPage } from "../pages/MatchDayDetailPage";
import { NewPollPage } from "../pages/NewPollPage";
import { PlayersPage } from "../pages/PlayersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "admin", element: <DashboardPage isAdmin /> },
      { path: "table", element: <LeagueTablePage /> },
      { path: "admin/polls/new", element: <NewPollPage /> },
      { path: "match-days/:matchDayId", element: <MatchDayDetailPage /> },
      { path: "admin/match-days/:matchDayId", element: <MatchDayDetailPage isAdmin /> },
      { path: "players", element: <PlayersPage /> },
    ],
  },
]);
