import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Roulette from './pages/Roulette.jsx';
import Blackjack from './pages/Blackjack';
import Slots from './pages/Slots';
import HorseRace from './pages/HorseRace';
import Auth from './pages/Auth';
import Payment from './pages/Payment';
import Transactions from './pages/Transactions';

function App() {
    // 1. INICJALIZACJA: Czytamy wszystko z jednego klucza 'user'
    const [loggedUser, setLoggedUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return null;
        
        const parsedUser = JSON.parse(savedUser);
        // Sprawdzamy, czy obiekt istnieje i czy ma token
        return parsedUser.token ? parsedUser : null; 
    });

    // 2. AKTUALIZACJA PUNKTÓW: Bezpiecznie nadpisuje tylko punkty, reszta (w tym token) zostaje
    const syncPoints = (newPoints) => {
        setLoggedUser(prev => {
            if (!prev) return null; // Zabezpieczenie
            
            // ...prev kopiuje WSZYSTKIE dotychczasowe dane (id, username, token)
            // po czym nadpisujemy tylko pole 'points'
            const updated = { 
                ...prev, 
                points: newPoints 
            };
            
            // Zapisujemy cały, kompletny obiekt z powrotem
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    // 3. WYLOGOWANIE: Usuwamy tylko jeden klucz
    const handleLogout = () => {
        localStorage.removeItem('user');
        setLoggedUser(null);
    };

    if (!loggedUser) return <Auth setLoggedUser={setLoggedUser} />;

    return (
        <Router>
            <div className="App" style={{ 
              background: 'black', 
              color: 'white', 
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              margin: 0,
              padding: 0,
              overflow: 'hidden'
            }}>
                <Navbar user={loggedUser} onLogout={handleLogout} />
                <main id="center" style={{ flex: 1, overflow: 'auto', width: '100%', margin: 0, padding: 0 }}>
                    <Routes>
                        <Route path="/" element={<Home user={loggedUser} />} />
                        <Route path="/roulette" element={<Roulette user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/blackjack" element={<Blackjack user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/slots" element={<Slots user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/horserace" element={<HorseRace user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/payment" element={<Payment user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/transactions" element={<Transactions user={loggedUser} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;