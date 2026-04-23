import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import App from './App.jsx'
import Projects from './Projects.jsx'
import Tool from './Tool.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tools/:cardKeyHash" element={<Tool />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
