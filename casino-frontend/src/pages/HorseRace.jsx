import React from 'react';

const Horses = ({ user, syncPoints }) => {
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
      letterSpacing: '3px', 
      textTransform: 'uppercase', 
      fontFamily: '"Arial Black", "Montserrat", "Impact", sans-serif',
      fontWeight: '900',
      fontSize: '2.5rem',
      margin: '10px 0 20px 0',
      color: '#fdd835', 
      textShadow: '0 0 10px rgba(253, 216, 53, 0.6), 0 0 25px rgba(253, 216, 53, 0.4), 0 0 40px rgba(253, 216, 53, 0.2)' // Efekt świecenia
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
        <h2 style={styles.title}>HorseRace</h2>
      </div>
      <div style={styles.card}>
        <p style={styles.text}>Tu bedzie podpiety i bedzie klasa</p>
      </div>
    </div>
  );
};

export default Horses;