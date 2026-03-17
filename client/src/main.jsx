import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './style-fc.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
