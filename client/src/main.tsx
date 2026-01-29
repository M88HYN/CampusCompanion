import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[main.tsx] Starting app initialization");

const root = document.getElementById("root");
if (!root) {
  console.error("[main.tsx] ERROR: Root element not found!");
  const errorDiv = document.createElement("div");
  errorDiv.innerHTML = "<h1 style='color: red; font-family: monospace; padding: 20px;'>FATAL ERROR: Root element #root not found in HTML</h1>";
  document.body.appendChild(errorDiv);
  throw new Error("Failed to find root element with id='root'");
}

console.log("[main.tsx] Root element found, creating React root");
const reactRoot = createRoot(root);

console.log("[main.tsx] Rendering App component");
reactRoot.render(<App />);

console.log("[main.tsx] App rendered successfully");

