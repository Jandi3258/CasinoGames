import React from 'react';

const Blackjack = ({ user, updatePoints }) => {
  const styles = {
    container: {
      padding: '60px 30px',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)',
      color: 'white'
    },
    header: {
      maxWidth: '800px',
      margin: '0 auto 50px',
      textAlign: 'center'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '900',
      marginBottom: '20px',
      background: 'linear-gradient(135deg, #ffb347, #ffcc33)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px',
      borderRadius: '20px',
      background: 'rgba(40, 45, 70, 0.4)',
      border: '2px solid rgba(255, 179, 71, 0.3)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    },
    text: {
      fontSize: '1.2rem',
      color: '#ddd',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🃏 Blackjack</h2>
      </div>
      <div style={styles.card}>
        <p style={styles.text}>Dobierz kartę lub spasuj!</p>
      </div>
    </div>
  );
};

export default Blackjack; 