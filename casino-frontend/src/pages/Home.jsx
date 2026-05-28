import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const styles = {
    container: {
      padding: '30px 20px',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '900',
      marginBottom: '10px',
      margin: '0 0 10px 0',
      background: 'linear-gradient(135deg, #ffb347, #ffcc33, #ffd700)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '0.05em'
    },
    subtitle: {
      fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
      color: '#aaa',
      fontWeight: '300',
      margin: '0'
    },
    gamesGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '0',
      width: '100%',
      boxSizing: 'border-box'
    },
    gameCard: {
      position: 'relative',
      padding: 'clamp(20px, 3vw, 35px) clamp(20px, 4vw, 30px)',
      borderRadius: '12px',
      textDecoration: 'none',
      color: '#fff',
      fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.4s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      textAlign: 'left',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '60px'
    },
    gameCardHover: {
      transform: 'translateX(10px) scale(1.02)',
      boxShadow: '0 20px 60px rgba(255, 179, 71, 0.3)',
      border: '2px solid rgba(255, 179, 71, 0.6)'
    },
    emoji: {
      marginRight: 'clamp(8px, 2vw, 15px)',
      fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
      flexShrink: 0
    }
  };

  const [hoveredGame, setHoveredGame] = React.useState(null);

  const games = [
    { 
      id: 'roulette',
      icon: '🎡', 
      name: 'Roulette',
      path: '/roulette',
      background: 'linear-gradient(135deg, rgba(139, 0, 139, 0.4) 0%, rgba(75, 0, 130, 0.3) 100%)'
    },
    { 
      id: 'blackjack', 
      icon: '♠️', 
      name: 'BlackJack', 
      path: '/blackjack',
      background: 'linear-gradient(135deg, rgba(0, 100, 0, 0.4) 0%, rgba(34, 139, 34, 0.3) 100%)'
    },
    { 
      id: 'slots', 
      icon: '🎰', 
      name: 'Slots', 
      path: '/slots',
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(184, 134, 11, 0.3) 100%)'
    },
    { 
      id: 'horserace', 
      icon: '🐴', 
      name: 'Horse Race', 
      path: '/horserace',
      background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.4) 0%, rgba(107, 142, 35, 0.3) 100%)'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
             <h1 style={{ 
        letterSpacing: '4px', 
        textTransform: 'uppercase', 
        fontFamily: '"Arial Black", "Montserrat", "Impact", sans-serif',
        fontWeight: '900',
        fontSize: '3rem',
        margin: '20px 0',
        color: '#fdd835', 
        textShadow: '0 0 10px rgba(253, 216, 53, 0.6), 0 0 25px rgba(253, 216, 53, 0.4), 0 0 40px rgba(253, 216, 53, 0.2)'
    }}>
        CASINO EMPIRE
    </h1>
        <p style={styles.subtitle}>Wybierz swoją ulubioną grę i zarabiaj punkty!</p>
      </div>

      <div style={styles.gamesGrid}>
        {games.map(game => (
          <Link
            key={game.id}
            to={game.path}
            style={{
              ...styles.gameCard,
              background: game.background,
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