"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f6f2",
          color: "#1c2430",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", width: "100%" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Roavo hit a serious error
          </h1>
          <p style={{ color: "#5b6472", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            We couldn&apos;t recover this session automatically. Try reloading the app.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#2f5f6f",
              color: "#fff",
              border: 0,
              borderRadius: "0.75rem",
              padding: "0.75rem 1.25rem",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Reload Roavo
          </button>
        </div>
      </body>
    </html>
  );
}
