import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Bulsa from './bulsa.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Bulsa />
  </StrictMode>
)