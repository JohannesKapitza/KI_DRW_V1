import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import EDIT from './EDIT';
import ANALYSE from './ANALYSE';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <nav style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
        <Link to="/">Home</Link>
      </nav>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/zeichnung-bearbeiten" element={<EDIT />} />
        <Route path="/daten-analysieren" element={<ANALYSE />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
