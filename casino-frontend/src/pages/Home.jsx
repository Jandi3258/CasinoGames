import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div style={{ textAlign: 'center', color: 'white' }}>
    <h1>🎰 Dashboard Kasyna 💰</h1>
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
      <Link to="/ruletka" style={{ background: '#2c3e50', padding: '20px', color: 'gold' }}>🎡 Ruletka</Link>
      <Link to="/farmer" style={{ background: '#2c3e50', padding: '20px', color: 'gold' }}>🚜 Farmer</Link>
      <Link to="/blackjack" style={{ background: '#2c3e50', padding: '20px', color: 'gold' }}>🚜 BlackJack</Link>
      <Link to="/slots" style={{ background: '#2c3e50', padding: '20px', color: 'gold' }}>🚜 Slots</Link>
    </div>
  </div>
);

export default Home;