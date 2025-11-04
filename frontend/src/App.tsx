import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AgendaProvider } from './context/AgendaContext';
import HomePage from './pages/HomePage';
import AgendaPage from './pages/AgendaPage';

export default function App() {
  return (
    <AgendaProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agenda/:id" element={<AgendaPage />} />
      </Routes>
    </AgendaProvider>
  );
}
