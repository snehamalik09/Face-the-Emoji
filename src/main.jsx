import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DarkModeThemeProvider } from "./context/DarkModeContext.jsx";


createRoot(document.getElementById('root')).render(
    <DarkModeThemeProvider>
    <App />
    </DarkModeThemeProvider>
)
