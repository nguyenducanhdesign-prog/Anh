import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Added .tsx extension to fix module resolution error.
import App from './App.tsx';
// FIX: Added .ts extension to fix module resolution error.
import { LanguageProvider } from './i18n.ts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);