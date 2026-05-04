import React, { useState } from 'react';

const Slots = ({ user, updatePoints }) => {
  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  const [reels, setReels] = useState(['❓', '❓', '❓']);
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [komunikat, setKomunikat] = useState('');

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
    balance: {
      fontSize: '1.3rem',
      fontWeight: '600',
      marginBottom: '30px',
      color: '#ffcc33'
    },
    machine: {
      marginBottom: '30px',
      padding: '30px',
      borderRadius: '16px',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '3px solid #ffcc33'
    },
    reelsContainer: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      marginBottom: '25px'
    },
    reel: {
      width: '100px',
      height: '100px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.2), rgba(255, 204, 51, 0.1))',
      border: '2px solid #ffcc33',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      fontWeight: '700'
    },
    inputGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#ddd'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 179, 71, 0.3)',
      background: 'rgba(255,255,255,0.05)',
      color: 'white',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px 20px',
      borderRadius: '14px',
      border: 'none',
      background: 'linear-gradient(135deg, #ffb347, #ffcc33)',
      color: '#111',
      fontWeight: '700',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    message: {
      marginTop: '20px',
      padding: '18px',
      borderRadius: '14px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255, 179, 71, 0.25)',
      color: '#f5f5f5',
      fontSize: '1rem',
      lineHeight: '1.5',
      minHeight: '60px'
    }
  };

  const spin = async () => {
    if (isSpinning) return;
    if (user.points < bet) {
      setKomunikat('Nie masz wystarczającej liczby punktów!');
      return;
    }

    setIsSpinning(true);
    setKomunikat('');
    await updatePoints(-bet);

    // Animacja obracania
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setReels(reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      spinCount++;
      if (spinCount > 15) {
        clearInterval(spinInterval);
        
        // Losowe wyniki
        const newReels = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
        setReels(newReels);

        // Sprawdzenie wygranej - najpierw ustawiamy wynik, potem komunikat
        // Nowy fragment z mnożnikami *8 i *2:
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
        const wygrana = bet * 8; // Mnożnik *8
        setKomunikat(`🎉 JACKPOT! Wygrałeś ${wygrana} pkt!`);
        updatePoints(wygrana);
    } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2] || newReels[0] === newReels[2]) {
        const wygrana = bet * 2; // Mnożnik *2
        setKomunikat(`✨ Wygrana! Wygrałeś ${wygrana} pkt!`);
        updatePoints(wygrana);
    } else {
          setKomunikat('Nie tym razem. Spróbuj jeszcze raz!');
        }

        setIsSpinning(false);
      }
    }, 80);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎰 Magic Slots</h2>
      </div>
      <div style={styles.card}>
        <p style={styles.balance}>💰 Saldo: {user.points} pkt</p>

        <div style={styles.machine}>
          <div style={styles.reelsContainer}>
            {reels.map((symbol, index) => (
              <div key={index} style={styles.reel}>{symbol}</div>
            ))}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Stawka (pkt):</label>
          <input
            style={styles.input}
            type="number"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            disabled={isSpinning}
          />
        </div>

        <button 
          onClick={spin} 
          style={styles.button}
          disabled={isSpinning}
          onMouseEnter={(e) => !isSpinning && (e.target.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !isSpinning && (e.target.style.transform = 'scale(1)')}
        >
          {isSpinning ? '⏳ Spinning...' : `SPIN! (koszt: ${bet} pkt)`}
        </button>

        {komunikat && <div style={styles.message}>{komunikat}</div>}
      </div>
    </div>
  );
};

export default Slots;