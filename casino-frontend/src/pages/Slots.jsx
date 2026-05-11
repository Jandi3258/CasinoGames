import React, { useState, useMemo } from 'react';

const SYMBOL_CONFIG = [
  { img: '🍒', label: 'Cherry', mult: 5, weight: 40 },
  { img: '🍋', label: 'Lemon', mult: 10, weight: 30 },
  { img: '🔔', label: 'Bell', mult: 25, weight: 15 },
  { img: '💎', label: 'Diamond', mult: 60, weight: 10 },
  { img: '⭐', label: 'Seven', mult: 150, weight: 5 },
];

const Slots = ({ user, updatePoints }) => {
  const [reels, setReels] = useState(['❓', '❓', '❓']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [komunikat, setKomunikat] = useState('Powodzenia!');

  const weightedSymbols = useMemo(() => 
    SYMBOL_CONFIG.flatMap(s => Array(s.weight).fill(s)), []
  );

  const getRandomSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];

  const cssAnimations = `
    @keyframes roll {
      0% { transform: translateY(-100%); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(100%); opacity: 0; }
    }
    @keyframes finish {
      0% { transform: translateY(-50px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .reel-spin { animation: roll 0.12s linear infinite; }
    .reel-finish { animation: finish 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  `;

  const styles = {
    container: {
      padding: '40px 20px',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)',
      color: 'white',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      width: '100%',
      maxWidth: '650px',
      padding: '40px',
      borderRadius: '40px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
      boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
    },
    machine: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
      margin: '30px 0',
    },
    reelWindow: {
      width: '120px',
      height: '140px',
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '20px',
      border: '2px solid rgba(255, 204, 51, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '4.5rem',
      overflow: 'hidden'
    },
    paytable: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginBottom: '30px',
      padding: '15px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    payItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontSize: '0.9rem',
      color: '#aaa'
    },
    input: {
      background: 'rgba(0,0,0,0.4)',
      border: '2px solid #ffcc33',
      color: '#ffcc33',
      padding: '12px',
      borderRadius: '15px',
      fontSize: '2rem',
      textAlign: 'center',
      width: '160px',
      marginBottom: '25px',
      fontWeight: 'bold',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '20px',
      borderRadius: '20px',
      border: 'none',
      background: isSpinning ? '#333' : 'linear-gradient(135deg, #ffcc33, #ffa500)',
      color: '#000',
      fontWeight: '900',
      fontSize: '1.4rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    winMessage: {
      marginTop: '25px',
      fontSize: '2rem',
      fontWeight: 'bold',
      color: komunikat.includes('!') ? '#ffcc33' : '#fff',
      textShadow: komunikat.includes('!') ? '0 0 15px rgba(255,204,51,0.6)' : 'none',
      minHeight: '2.5rem'
    }
  };

  const spin = async () => {
    if (isSpinning || user.points < bet || bet <= 0) return;

    setIsSpinning(true);
    setKomunikat('Mieszanie...');
    await updatePoints(-bet);

    const duration = 1500;
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      setReels([getRandomSymbol().img, getRandomSymbol().img, getRandomSymbol().img]);
      if (Date.now() - startTime > duration) {
        clearInterval(timer);
        finalize();
      }
    }, 100);

    const finalize = () => {
      const final = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
      setReels(final.map(s => s.img));
      
      const [s1, s2, s3] = final;
      setTimeout(() => {
        if (s1.img === s2.img && s2.img === s3.img) {
          const win = bet * s1.mult;
          setKomunikat(`🔥 JACKPOT: +${win} PKT!`);
          updatePoints(win);
        } else if (s1.img === s2.img || s2.img === s3.img || s1.img === s3.img) {
          // Wygrana za parę (2.5x stawka)
          const win = Math.floor(bet * 2.5);
          setKomunikat(`✨ PARA: +${win} PKT!`);
          updatePoints(win);
        } else {
          setKomunikat('Graj dalej! 🍀');
        }
        setIsSpinning(false);
      }, 500);
    };
  };

  return (
    <div style={styles.container}>
      <style>{cssAnimations}</style>
      
      <div style={styles.card}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '25px', color: '#ffcc33', letterSpacing: '4px' }}>
          CASINO SLOTS
        </h2>

        {/* Tabela wypłat */}
        <div style={styles.paytable}>
          {SYMBOL_CONFIG.map((s) => (
            <div key={s.img} style={styles.payItem}>
              <span style={{fontSize: '1.5rem'}}>{s.img}</span>
              <span style={{color: '#ffcc33', fontWeight: 'bold'}}>x{s.mult}</span>
            </div>
          ))}
        </div>

        <div style={styles.machine}>
          {reels.map((symbol, i) => (
            <div key={i} style={styles.reelWindow}>
              <div className={isSpinning ? 'reel-spin' : 'reel-finish'}>
                {symbol}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>TWOJA STAWKA</label>
          <input 
            type="number" 
            value={bet} 
            onChange={e => setBet(Math.max(1, Number(e.target.value)))}
            style={styles.input}
            disabled={isSpinning}
          />
        </div>

        <button 
          style={styles.button} 
          onClick={spin}
          disabled={isSpinning}
          onMouseDown={e => !isSpinning && (e.target.style.transform = 'scale(0.96)')}
          onMouseUp={e => !isSpinning && (e.target.style.transform = 'scale(1)')}
        >
          {isSpinning ? 'LOSOWANIE...' : 'ZAGRAJ'}
        </button>

        <div style={styles.winMessage}>
          {komunikat}
        </div>
      </div>
    </div>
  );
};

export default Slots;