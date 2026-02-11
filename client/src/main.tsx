import { createRoot } from "react-dom/client";
import App from "./App";
import { Providers } from "./components/providers";
import "./index.css";

// Suppress Privy wallet detection errors (non-fatal warnings from wallet providers)
const originalError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Invalid hook call') ||
    message.includes('Hooks can only be called inside')
  )) {
    // Suppress these specific Privy wallet detection warnings
    return;
  }
  originalError.apply(console, args);
};

// Also suppress unhandled promise rejections from wallet detection
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('hook') || 
      event.reason?.message?.includes('Invalid hook call')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
  </Providers>
);
