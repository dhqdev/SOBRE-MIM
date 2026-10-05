import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App.tsx'
import './index.css'
import { startPeriodWatcher } from './lib/period'

// Antes do primeiro render, pra página já nascer com as cores da hora certa.
startPeriodWatcher();

createRoot(document.getElementById("root")!).render(<App />);
