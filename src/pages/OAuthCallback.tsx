// src/pages/OAuthCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      // 📌 STEP 1: Get the data from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const errorParam = params.get("error");

      // 📌 STEP 2: Check if user cancelled on TikTok page
      if (errorParam === "access_denied") {
        navigate("/?error=access_denied");
        return;
      }

      // 📌 STEP 3: Check if there's any other error
      if (errorParam) {
        navigate("/?error=oauth_failed");
        return;
      }

      // 📌 STEP 4: Check if code is missing
      if (!code) {
        navigate("/?error=missing_code");
        return;
      }

      // 📌 STEP 5: Check if state is missing
      if (!state) {
        navigate("/?error=invalid_state");
        return;
      }

      // 📌 STEP 6: Everything is okay, try to connect
      try {
        await handleCallback(code, state);
        navigate("/"); // Success! Go to home page
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/?error=oauth_failed");
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  // 🎨 Loading screen while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connecting to TikTok...
        </h2>
        <p className="text-sm text-gray-600">
          Please wait while we complete the connection
        </p>
      </div>
    </div>
  );
}
