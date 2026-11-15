import { useEffect, useState } from "react";

export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Backend health check failed");
        return response.json();
      })
      .then((data) => setApiStatus(`Backend: ${data.status}; database: ${data.database}`))
      .catch(() => setApiStatus("Backend unavailable"));
  }, []);

  return (
    <main className="page">
      <section className="welcome-card">
        <p className="eyebrow">ECE1779 · TEAM PROJECT</p>
        <h1>Restaurant discovery, made social.</h1>
        <p className="intro">
          This is the starter frontend. Replace this screen with the team's
          restaurant discovery experience.
        </p>
        <p className="status" aria-live="polite">{apiStatus}</p>
      </section>
    </main>
  );
}
