import { createRoot } from 'react-dom/client'
import './legacy.css'
import './index.css'
import App from './App'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        void reg.update()
      })
      .catch((err) => {
        console.warn('SW registration error:', err)
      })
  })
}

createRoot(document.getElementById('root')!).render(<App />)
