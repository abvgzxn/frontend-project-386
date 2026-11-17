import "@mantine/core/styles.css";
import { client } from "@call-calendar/api-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

client.setConfig({ baseUrl: window.location.origin });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
