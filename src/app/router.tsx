import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { EditPollPage } from "../pages/EditPollPage";
import { LeagueTablePage } from "../pages/LeagueTablePage";
import { MatchDayDetailPage } from "../pages/MatchDayDetailPage";
import { NewPollPage } from "../pages/NewPollPage";
import { PlayersPage } from "../pages/PlayersPage";
import { ProfilePage } from "../pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "admin", element: <Navigate replace to="/" /> },
      { path: "table", element: <LeagueTablePage /> },
      { path: "polls/new", element: <NewPollPage /> },
      { path: "polls/:matchDayId/edit", element: <EditPollPage /> },
      { path: "admin/polls/new", element: <Navigate replace to="/polls/new" /> },
      { path: "match-days/:matchDayId", element: <MatchDayDetailPage /> },
      { path: "admin/match-days/:matchDayId", element: <Navigate replace to="/" /> },
      { path: "players", element: <PlayersPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);
