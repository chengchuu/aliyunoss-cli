import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("examples-root");
if (!root) throw new Error("The examples root element is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
