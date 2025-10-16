import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TemporaryScheduleProvider } from './features/schedule/contexts/TemporaryScheduleContext'
import { AuthProvider } from './features/auth/contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TemporaryScheduleProvider>
        <App />
      </TemporaryScheduleProvider>
    </AuthProvider>
  </StrictMode>,
)
