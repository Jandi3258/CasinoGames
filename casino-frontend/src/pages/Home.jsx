import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const styles = {
    container: {
      padding: '60px 30px',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)',
      color: 'white'
    },
    header: {
      textAlign: 'center',
      marginBottom: '80px'
    },
    title: {
      fontSize: '3.5rem',
      fontWeight: '900',
      marginBottom: '20px',
      background: 'linear-gradient(135deg, #ffb347, #ffcc33, #ffd700)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '0.05em'
    },
    subtitle: {
      fontSize: '1.3rem',
      color: '#aaa',
      fontWeight: '300'
    },
    gamesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '30px',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px'
    },
    gameCard: {
      position: 'relative',
      padding: '40px 30px',
      borderRadius: '20px',
      background: 'rgba(40, 45, 70, 0.4)',
      border: '2px solid rgba(255, 179, 71, 0.3)',
      textDecoration: 'none',
      color: '#fff',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    },
    gameCardHover: {
      transform: 'translateY(-8px)',
      borderColor: 'rgba(255, 179, 71, 0.8)',
      background: 'rgba(60, 65, 90, 0.6)',
      boxShadow: '0 20px 50px rgba(255, 179, 71, 0.2)'
    },
    emoji: {
      marginRight: '15px',
      fontSize: '2.5rem'
    }
  };

  const [hoveredGame, setHoveredGame] = React.useState(null);

  const games = [
    { id: 'ruletka', icon: '🎡', name: 'Ruletka', path: '/ruletka' },
    { id: 'blackjack', icon: '♠️', name: 'BlackJack', path: '/blackjack' },
    { id: 'slots', icon: '🎰', name: 'Slots', path: '/slots' },
    { id: 'farmer', icon: '🚜', name: 'Super Farmer', path: '/farmer' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎰 CASINO EMPIRE 💎</h1>
        <p style={styles.subtitle}>Wybierz swoją ulubioną grę i zarabiaj punkty!</p>
      </div>

      <div style={styles.gamesGrid}>
        {games.map(game => (
          <Link
            key={game.id}
            to={game.path}
            style={{
              ...styles.gameCard,
              ...(hoveredGame === game.id ? styles.gameCardHover : {})
            }}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
          >
            <span style={styles.emoji}>{game.icon}</span>
            <span>{game.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;