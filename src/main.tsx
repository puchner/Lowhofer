import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { SessionProvider } from "./session/SessionContext";
import { PlannerProvider } from "./state/PlannerContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <PlannerProvider>
        <RouterProvider router={router} />
      </PlannerProvider>
    </SessionProvider>
  </StrictMode>,
);
