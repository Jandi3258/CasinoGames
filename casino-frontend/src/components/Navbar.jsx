import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav style={{ background: '#000', padding: '15px', color: 'gold', display: 'flex', justifyContent: 'space-between' }}>
    <Link to="/" style={{ color: 'gold', textDecoration: 'none' }}>🏠 Home</Link>
    <span>Saldo: 1000 pkt</span>
  </nav>
);

export default Navbar;