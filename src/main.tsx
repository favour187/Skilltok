// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeAdMob, prepareAppOpenAd, showAppOpenAd, prepareInterstitialAd } from "./services/admob";

initializeAdMob().then(async () => {
  await prepareAppOpenAd();
  await showAppOpenAd();
  await prepareInterstitialAd();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
