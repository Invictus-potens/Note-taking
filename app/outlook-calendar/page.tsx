"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/authContext";
import ProtectedRoute from "../../components/Auth/ProtectedRoute";
import Header from "../../components/Layout/Header";
import { supabase } from "../../lib/supabaseClient";

function OutlookCalendarApp() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const checkOutlookConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("outlook_tokens")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (error && error.code !== "PGRST116") {
          console.error("Error checking Outlook connection:", error);
        }
        setIsConnected(!!data);
      } catch (err) {
        setError("Failed to check Outlook connection");
      } finally {
        setIsLoading(false);
      }
    };
    checkOutlookConnection();
  }, [user]);

  const handleMicrosoftLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI || "");
    const scopes = encodeURIComponent(
      "Calendars.Read Calendars.ReadWrite Calendars.Read.Shared User.Read"
    );
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&response_mode=query`;
    window.location.href = authUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Outlook Calendar...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <div className="main-content-area p-8">
        <h1 className="text-2xl font-bold mb-4">Outlook Calendar</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        {!isConnected ? (
          <button
            onClick={handleMicrosoftLogin}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect Microsoft Account
          </button>
        ) : (
          <div className="p-4 bg-green-100 rounded">
            <p className="text-green-700">Connected to Outlook!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutlookCalendarPage() {
  return (
    <ProtectedRoute>
      <OutlookCalendarApp />
    </ProtectedRoute>
  );
} 