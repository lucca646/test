import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LiquidGlassFilters } from "liquid-glass-nav";
import "liquid-glass-nav/styles.css";
import "./components/dynamic-island.css";
import "./components/platform-frames.css";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LiquidGlassFilters />
    <App />
  </StrictMode>,
);
