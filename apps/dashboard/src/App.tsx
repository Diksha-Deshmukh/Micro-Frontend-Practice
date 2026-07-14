import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OverviewPage } from "./pages/OverviewPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
