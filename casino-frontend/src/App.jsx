import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// IMPORTUJ SWOJE KOMPONENTY (Upewnij się, że ścieżki są poprawne!)
import Navbar from './components/Navbar'; // lub tam, gdzie go masz
import Home from './pages/Home';
import Ruletka from './pages/Ruletka';
import Blackjack from './pages/Blackjack';
import Slots from './pages/Slots';

function App() {
  return (
      <Router>
        <div className="App">
          <Navbar />
          <main id="center">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ruletka" element={<Ruletka />} />
              <Route path="/blackjack" element={<Blackjack />} />
              <Route path="/slots" element={<Slots />} />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

export default App;