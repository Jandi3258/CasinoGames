import React, { useState } from 'react';

const Ruletka = ({ user, updatePoints }) => {
    const [wynik, setWynik] = useState(null);
    const [bet, setBet] = useState(10);
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
        result: {
            marginTop: '30px',
            padding: '20px',
            borderRadius: '14px',
            background: 'rgba(255, 179, 71, 0.1)',
            border: '2px solid rgba(255, 179, 71, 0.5)',
            fontSize: '2rem',
            textAlign: 'center',
            fontWeight: '700',
            color: '#ffcc33'
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

    const losuj = async () => {
        if (!bet || bet <= 0) {
            setWynik(null);
            setKomunikat('Podaj poprawną stawkę większą niż 0 pkt.');
            return;
        }

        if (user.points < bet) {
            setWynik(null);
            setKomunikat(`Nie masz wystarczającej liczby punktów. Masz ${user.points} pkt.`);
            return;
        }

        const liczba = Math.floor(Math.random() * 37);
        setWynik(liczba);

        if (liczba === 7) {
            setKomunikat('🎉 JACKPOT! Wypadło 7 i wygrałeś 100 pkt!');
            await updatePoints(-bet);
            await updatePoints(100);
        } else {
            setKomunikat(`Wypadło ${liczba}. Przegrałeś stawkę ${bet} pkt. Spróbuj jeszcze raz!`);
            await updatePoints(-bet);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🎡 Ruletka</h2>
            </div>
            <div style={styles.card}>
                <p style={styles.balance}>💰 Saldo: {user.points} pkt</p>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Stawka (pkt):</label>
                    <input
                        style={styles.input}
                        type="number"
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                    />
                </div>

                <button onClick={losuj} style={styles.button} onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                    Kręć kołem (koszt: {bet} pkt)
                </button>

                {wynik !== null && <div style={styles.result}>🎯 Wypadło: {wynik}</div>}
                {komunikat && <div style={styles.message}>{komunikat}</div>}
            </div>
        </div>
    );
};

export default Ruletka;