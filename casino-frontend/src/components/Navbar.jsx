import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => (
    <nav style={{ 
      background: '#000', 
      padding: '12px 16px', 
      color: 'gold', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: '15px',
      borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
      boxSizing: 'border-box',
      width: '100%',
      flexWrap: 'nowrap'
    }}>

        <Link to="/" style={{ 
          color: 'gold', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          fontSize: '0.95rem',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>🏠 Strona Glowna</Link>
        
        <Link to="/payment" style={{ 
          color: 'gold', 
          textDecoration: 'none',
          fontSize: '0.95rem',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>💳 Płatności</Link>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          fontSize: '0.9rem',
          marginLeft: 'auto',
          flexShrink: 0
        }}>
            <span style={{ whiteSpace: 'nowrap' }}>👤 {user.username}</span>
            <span style={{ whiteSpace: 'nowrap' }}>| Saldo: {Number(user.points).toFixed(2)} pkt</span>

            <button
                onClick={onLogout}
                style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}
            >
                Wyloguj
            </button>
        </div>

    </nav>
);

export default Navbar;