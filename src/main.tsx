import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {AuthProvider} from "./contexts/AuthContext.tsx";
import {BrowserRouter, Route, Routes} from "react-router";
import RootLayout from './components/RootLayout.tsx';
import { OAuthCallback } from './pages/OAuthCallback.tsx';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {" "}
      {/* Add Router */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<App />} />
            <Route path="auth/callback" element={<OAuthCallback />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
