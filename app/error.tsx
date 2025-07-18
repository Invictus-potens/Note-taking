"use client";

import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error to the console for debugging
  console.error("Global App Error:", error);

  return (
    <html>
      <body>
        <div style={{ padding: 32 }}>
          <h2>Something went wrong!</h2>
          <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>{error.message}</pre>
          <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 4, background: '#ef4444', color: 'white', border: 'none' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
} 