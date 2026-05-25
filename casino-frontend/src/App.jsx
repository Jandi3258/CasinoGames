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
    const [loggedUser, setLoggedUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if(!savedUser) return null;
        let x = JSON.parse(savedUser);
        //return x;
        return x.token ? x : null; // dodatkowa weryfikacja, czy obiekt ma token, jeśli nie, to traktujemy jak niezalogowany
    });

    //debug potem usunac 
    console.log(loggedUser);
    console.log('App component rendered');
    const syncPoints = (newPoints) => {
        setLoggedUser(prev => {
            const updated = { ...prev, points: newPoints };
            //delete updated.token; // usuwamy token z obiektu, żeby nie przechowywać go w stanie, ale nadal jest w localStorage
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;

        });
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
                {/* Przekazujemy dane użytkownika do Navbar, żeby mógł wyświetlić punkty */}
                <Navbar user={loggedUser} onLogout={() => { localStorage.removeItem('user'); setLoggedUser(null); }} />
                <main id="center" style={{
                  flex: 1,
                  overflow: 'auto',
                  width: '100%',
                  margin: 0,
                  padding: 0
                }}>
                    <Routes>
                        <Route path="/" element={<Home user={loggedUser} />} />
                        <Route path="/roulette" element={<Roulette user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/blackjack" element={<Blackjack user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/slots" element={<Slots user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/horserace" element={<HorseRace user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/payment" element={<Payment user={loggedUser} syncPoints={syncPoints}/>} />
                        <Route path="/transactions" element={<Transactions user={loggedUser} />} />
                        {/* Przekierowanie, jeśli ktoś wejdzie na nieistniejącą stronę */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;