import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Make sure this line is correct
// import './index.css' // This line should ideally be commented out or removed if only using Tailwind CDN

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)