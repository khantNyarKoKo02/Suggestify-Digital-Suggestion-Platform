
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root container with id "root" not found');
}

const root = createRoot(container);
root.render(<div />);

import("./App")
  .then(({ default: App }) => {
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  })
  .catch((err) => {
    const message = (err && (err.stack || err.message)) || String(err);
    root.render(
      <div style={{ padding: 16, fontFamily: "sans-serif" }}>
        <h1>Failed to load application</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>
      </div>
    );
  });
