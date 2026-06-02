import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#2d2926',
            border: '1px solid rgba(43, 124, 184, 0.25)',
          },
          success: { iconTheme: { primary: '#2b7cb8', secondary: '#ffffff' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
