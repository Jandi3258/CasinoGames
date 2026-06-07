import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => (
    <nav style={{ 
      background: 'linear-gradient(90deg, #0a0c14 0%, #151828 50%, #0a0c14 100%)', 
      padding: '14px 28px', 
      color: '#ffcc33', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: '20px',
      borderBottom: '1px solid rgba(255, 204, 51, 0.2)',
      boxSizing: 'border-box',
      width: '100%',
      flexWrap: 'nowrap',
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)' 
    }}>

        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <Link to="/" style={{ 
              color: '#ffcc33', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '1rem', 
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(255, 204, 51, 0.3)',
              flexShrink: 0
            }}>
                Strona główna
            </Link>
            
            <Link to="/payment" style={{ 
              color: '#b3b9c5', 
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
                💳 Płatności
            </Link>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          fontSize: '0.95rem', 
          marginLeft: 'auto',
          flexShrink: 0,
          fontWeight: '500'
        }}>
            <span style={{ color: '#f8f9fa', whiteSpace: 'nowrap' }}>👤 {user.username}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '1.2rem', margin: '0 -5px' }}>•</span>
            <span style={{ color: '#ffcc33', whiteSpace: 'nowrap', fontWeight: '600' }}>
                💰 Saldo: {Number(user.points).toFixed(2)} pkt
            </span>

            <button
                onClick={onLogout}
                style={{
                    background: 'linear-gradient(135deg, #ff5252, #c0392b)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px', 
                    marginLeft: '15px',
                    cursor: 'pointer',
                    borderRadius: '24px', 
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.25)'
                }}
            >
                Wyloguj
            </button>
        </div>
    </nav>
);

export default Navbar;