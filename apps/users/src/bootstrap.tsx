import { RemoteErrorBoundary } from "@mfe/shared";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import UsersPage from "./UsersPage";
import "@mfe/shared/styles.css";
import "./users.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("The Users application requires an element with id 'root'.");
}

createRoot(container).render(
  <StrictMode>
    <RemoteErrorBoundary>
      <main className="mfe-users-standalone">
        <UsersPage />
      </main>
    </RemoteErrorBoundary>
  </StrictMode>
);
