import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SplashScreenManager } from "./components/splash/SplashScreenManager";
import "./index.css";
import "./styles/mobile.css"; // Mobile & PWA optimizations

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SplashScreenManager duration={3000} showSplashOnMount={true}>
        <App />
      </SplashScreenManager>
    </BrowserRouter>
  </React.StrictMode>
);

