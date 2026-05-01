import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Ruletka from './pages/Ruletka';
import Blackjack from './pages/Blackjack';
import Slots from './pages/Slots';
import Auth from './pages/Auth';
import Payment from './pages/Payment';

function App() {
    console.log('App component rendering');
    const [loggedUser, setLoggedUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        console.log('Loaded user from localStorage:', savedUser);
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogout = () => {
        localStorage.removeItem('user');
        setLoggedUser(null);
    };

    // Metoda dodaje określoną liczbę punktów (moze być ujemna)
    // Przykład użycia w Ruletka.jsx
    const updatePoints = async (amount) => {
        const res = await fetch('http://localhost:8080/api/update-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loggedUser.username, amount })
        });
        const data = await res.json();
        if (res.ok) {
            const updatedUser = { ...loggedUser, points: data.newPoints };
            setLoggedUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Aktualizujemy też localStorage
        }
    };

    // Jeśli użytkownik NIE jest zalogowany, pokazujemy TYLKO stronę logowania
    if (!loggedUser) {
        return <Auth setLoggedUser={setLoggedUser} />;
    }

    // Jeśli JEST zalogowany, pokazujemy całe kasyno
    return (
        <Router>
            <div className="App" style={{ background: 'black', color: 'white', minHeight: '100vh' }}>
                {/* Przekazujemy dane użytkownika do Navbar, żeby mógł wyświetlić punkty */}
                <Navbar user={loggedUser} onLogout={handleLogout} />
                <main id="center">
                    <Routes>
                        <Route path="/" element={<Home user={loggedUser} />} />
                        <Route path="/ruletka" element={<Ruletka user={loggedUser} updatePoints={updatePoints}/>} />
                        <Route path="/blackjack" element={<Blackjack user={loggedUser} updatePoints={updatePoints}/>} />
                        <Route path="/slots" element={<Slots user={loggedUser} updatePoints={updatePoints}/>} />
                        <Route path="/payment" element={<Payment user={loggedUser} updatePoints={updatePoints}/>} />
                        {/* Przekierowanie, jeśli ktoś wejdzie na nieistniejącą stronę */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;