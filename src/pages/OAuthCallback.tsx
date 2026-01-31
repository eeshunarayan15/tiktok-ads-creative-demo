// src/pages/OAuthCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { handleCallback, error } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      // Get code and state from URL params
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      // Handle OAuth errors
      if (errorParam) {
        console.error("OAuth error:", errorParam, errorDescription);
        navigate(
          "/?error=" + encodeURIComponent(errorDescription || errorParam),
        );
        return;
      }

      // Validate required params
      if (!code || !state) {
        navigate("/?error=" + encodeURIComponent("Missing authorization code"));
        return;
      }

      try {
        await handleCallback(code, state);
        navigate("/");
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/?error=" + encodeURIComponent("Authentication failed"));
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connecting to TikTok...
        </h2>
        <p className="text-sm text-gray-600">
          Please wait while we complete the authentication
        </p>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
