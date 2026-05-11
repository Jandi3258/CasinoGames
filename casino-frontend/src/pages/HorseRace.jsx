import React from 'react';

const Horses = () => {
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)',
      color: '#ffcc33',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <p>🏇</p>
        <p>Tu bedzie Horse Race</p>
      </div>
    </div>
  );
};

export default Horses;