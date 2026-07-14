import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ProductsPage from "./ProductsPage";

const container = document.getElementById("root");

if (!container) {
  throw new Error("The products root element was not found.");
}

createRoot(container).render(
  <StrictMode>
    <main className="products-standalone">
      <ProductsPage />
    </main>
  </StrictMode>
);
