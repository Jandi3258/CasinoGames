import React, { useState, useMemo, useRef } from 'react';

const SYMBOL_CONFIG = [
  { img: '🍒', label: 'Cherry', mult: 5, weight: 40 },
  { img: '🍋', label: 'Lemon', mult: 10, weight: 30 },
  { img: '🔔', label: 'Bell', mult: 25, weight: 15 },
  { img: '💎', label: 'Diamond', mult: 60, weight: 10 },
  { img: '⭐', label: 'Seven', mult: 150, weight: 5 },
];

const Slots = ({ user, syncPoints }) => {
  const [reels, setReels] = useState(['❓', '❓', '❓']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState('');
  const [komunikat, setKomunikat] = useState('Powodzenia!');
  const [spinningReels, setSpinningReels] = useState(['stop', 'stop', 'stop']);

  const weightedSymbols = useMemo(() =>
      SYMBOL_CONFIG.flatMap(s => Array(s.weight).fill(s)), []
  );

  const spinningReelsRef = useRef(['stop', 'stop', 'stop']);

  const updateSpinning = (updater) => {
    setSpinningReels(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      spinningReelsRef.current = next;
      return next;
    });
  };

  const getRandomSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];

  const slowDownReel = (index, finalSymbol, delays) => {
    updateSpinning(prev => {
      const newSpinning = [...prev];
      newSpinning[index] = 'slow';
      return newSpinning;
    });
    let i = 0;
    const next = () => {
      setReels(prev => {
        const newReels = [...prev];
        newReels[index] = getRandomSymbol().img;
        return newReels;
      });
      i++;
      if (i < delays.length) {
        setTimeout(next, delays[i]);
      } else {
        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = finalSymbol.img;
          return newReels;
        });
        updateSpinning(prev => {
          const newSpinning = [...prev];
          newSpinning[index] = 'stop';
          return newSpinning;
        });
      }
    };
    next();
  };

  const spin = async () => {
    if (isSpinning) return;

    const numericBet = parseInt(bet, 10);
    if (isNaN(numericBet) || numericBet < 10) {
      setKomunikat('❌ Minimalna stawka to 10 pkt!');
      return;
    }
    if (user.points < numericBet) {
      setKomunikat('❌ Za mało punktów!');
      return;
    }

    setIsSpinning(true);
    setKomunikat('Mieszanie...');
    updateSpinning(['spin', 'spin', 'spin']);

    const spinInterval = setInterval(() => {
      setReels(prev => prev.map((reel, i) => spinningReelsRef.current[i] === 'spin' ? getRandomSymbol().img : reel));
    }, 100);

    try {
      const res = await fetch('http://localhost:8080/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          gameName: 'Slots',
          betAmount: numericBet
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setKomunikat('❌ Błąd: ' + data.message);
        clearInterval(spinInterval);
        setIsSpinning(false);
        updateSpinning(['stop', 'stop', 'stop']);
        return;
      }

      const backendReels = data.gameData.reels;
      const finalSymbols = backendReels.map(sym => ({ img: sym }));

      setTimeout(() => {
        slowDownReel(0, finalSymbols[0], [200, 300, 400, 500]);
      }, 1200);

      setTimeout(() => {
        slowDownReel(1, finalSymbols[1], [200, 300, 400, 500]);
      }, 2000);

      setTimeout(() => {
        slowDownReel(2, finalSymbols[2], [200, 300, 400, 500]);
        clearInterval(spinInterval);

        setTimeout(() => {
          syncPoints(data.newPoints);

          if (data.won) {
            const [s1, s2, s3] = backendReels;
            if (s1 === s2 && s2 === s3) {
              setKomunikat(`🔥 JACKPOT: +${data.payout} PKT!`);
            } else {
              setKomunikat(`✨ PARA: +${data.payout} PKT!`);
            }
          } else {
            setKomunikat('Graj dalej! 🍀');
          }
          setIsSpinning(false);
        }, 1000);
      }, 2800);

    } catch {
      setKomunikat('❌ Brak połączenia z serwerem!');
      clearInterval(spinInterval);
      setIsSpinning(false);
      updateSpinning(['stop', 'stop', 'stop']);
    }
  };

  const cssAnimations = `
    @keyframes roll { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
    @keyframes slow-roll { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
    @keyframes finish { 0% { transform: translateY(-50px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    .reel-spin { animation: roll 0.12s linear infinite; }
    .reel-slow { animation: slow-roll 0.3s linear infinite; }
    .reel-finish { animation: finish 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  `;

  const styles = {
    container: { padding: '40px 20px', minHeight: '100vh', background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    card: { width: '100%', maxWidth: '650px', padding: '40px', borderRadius: '40px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' },
    machine: { display: 'flex', gap: '15px', justifyContent: 'center', margin: '30px 0' },
    reelWindow: { width: '120px', height: '140px', background: 'rgba(0,0,0,0.5)', borderRadius: '20px', border: '2px solid rgba(255, 204, 51, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem', overflow: 'hidden' },
    paytable: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' },
    payItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.9rem', color: '#aaa' },
    input: { background: 'rgba(0,0,0,0.4)', border: '2px solid #ffcc33', color: '#ffcc33', padding: '12px', borderRadius: '15px', fontSize: '2rem', textAlign: 'center', width: '160px', marginBottom: '25px', fontWeight: 'bold', outline: 'none' },
    button: { width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: isSpinning ? '#333' : 'linear-gradient(135deg, #ffcc33, #ffa500)', color: '#000', fontWeight: '900', fontSize: '1.4rem', cursor: isSpinning ? 'default' : 'pointer', transition: 'all 0.2s' },
    winMessage: { marginTop: '25px', fontSize: '2rem', fontWeight: 'bold', color: komunikat.includes('!') ? '#ffcc33' : '#fff', textShadow: komunikat.includes('!') ? '0 0 15px rgba(255,204,51,0.6)' : 'none', minHeight: '2.5rem' }
  };

  return (
      <div style={styles.container}>
        <style>{cssAnimations}</style>
        <div style={styles.card}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '25px', color: '#ffcc33', letterSpacing: '4px' }}>CASINO SLOTS</h2>
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
                  <div className={spinningReels[i] === 'spin' ? 'reel-spin' : spinningReels[i] === 'slow' ? 'reel-slow' : 'reel-finish'}>
                    {symbol}
                  </div>
                </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>TWOJA STAWKA</label>
            <input type="number" value={bet} onChange={e => setBet(e.target.value)} style={styles.input} disabled={isSpinning} />
          </div>
          <button style={styles.button} onClick={spin} disabled={isSpinning}>
            {isSpinning ? 'LOSOWANIE...' : 'ZAGRAJ'}
          </button>
          <div style={styles.winMessage}>{komunikat}</div>
        </div>
      </div>
  );
};

export default Slots;