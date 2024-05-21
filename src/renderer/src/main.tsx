import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '@renderer/pageApp/App'
import Result from '@renderer/pageResult/Result'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/result',
    element: <Result />
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
