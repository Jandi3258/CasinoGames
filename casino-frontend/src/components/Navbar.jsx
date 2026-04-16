import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => (
    <nav style={{ background: '#000', padding: '15px', color: 'gold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        <Link to="/" style={{ color: 'gold', textDecoration: 'none', fontWeight: 'bold' }}>🏠 Home</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Wyświetlamy dynamicznie nazwę i punkty konkretnego gracza */}
            <span>👤 {user.username} | Saldo: {user.points} pkt</span>

            {/* Przycisk wylogowania podpięty pod funkcję z App.jsx */}
            <button
                onClick={onLogout}
                style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
            >
                Wyloguj
            </button>
        </div>

    </nav>
);

export default Navbar;