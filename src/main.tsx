import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress specific React DOM nesting warning from react-day-picker calendar
// This is a known issue with the library and doesn't affect functionality
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (
    typeof message === 'string' && 
    message.includes('validateDOMNesting') && 
    message.includes('button cannot appear as a descendant of button')
  ) {
    return;
  }
  originalWarn(message, ...args);
};

createRoot(document.getElementById("root")!).render(<App />);
