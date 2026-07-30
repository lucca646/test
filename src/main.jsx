import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LiquidGlassFilters } from "./components/liquidGlass/LiquidGlassFilter.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LiquidGlassFilters />
    <App />
  </StrictMode>,
);
