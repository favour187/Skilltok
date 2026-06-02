// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeAdMob, prepareAppOpenAd, showAppOpenAd, prepareInterstitialAd } from "./services/admob";

initializeAdMob().then(async () => {
  await prepareAppOpenAd();
  await prepareInterstitialAd();
  setTimeout(async () => {
    try {
      await showAppOpenAd();
    } catch (e) {
      console.warn('App open ad skipped:', e);
    }
      }, 2000);
} catch (e) {
  console.warn('AdMob init skipped:', e);
}
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
