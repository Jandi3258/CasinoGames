import React, { useState } from 'react';

// Oficjalna sekwencja numerów na kole europejskim
const W = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const NUM_SEGMENTS = 37;
const DEGREES_PER_SEGMENT = 360 / NUM_SEGMENTS;

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const Roulette = ({ user, syncPoints }) => {
    // STANY GRY
    const [wynik, setWynik] = useState(null);
    const [betAmount, setBetAmount] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [komunikat, setKomunikat] = useState('Wybierz typ zakładu i kręć!');
    const [wheelRotation, setWheelRotation] = useState(0);

    // STANY ZAKŁADU
    const [betType, setBetType] = useState('color'); // 'color' lub 'number'
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(''); // Domyślnie puste

    // LOGIKA POMOCNICZA
    const getNumberColor = (num) => {
        if (num === 0) return 'green';
        if (redNumbers.includes(num)) return 'red';
        if (blackNumbers.includes(num)) return 'black';
        return 'gray';
    };

    // Dynamiczny gradient dopasowany do tablicy W
    const generatedGradient = W.map((num, i) => {
        const color = getNumberColor(num);
        const hex = color === 'green' ? '#0a0' : color === 'red' ? '#d00' : '#111';
        return `${hex} ${i * DEGREES_PER_SEGMENT}deg ${(i + 1) * DEGREES_PER_SEGMENT}deg`;
    }).join(', ');

    // OBSŁUGA WYBORU ZAKŁADU
    const selectColorBet = (color) => {
        if (isSpinning) return;
        setBetType('color');
        setSelectedColor(color);
        setSelectedNumber(''); // Czyścimy numer przy wyborze koloru
        setKomunikat(`Obstawiono kolor: ${color === 'red' ? 'Czerwony' : color === 'black' ? 'Czarny' : 'Zielony'}`);
    };

    const selectNumberBet = (val) => {
        if (isSpinning) return;
        setBetType('number');
        setSelectedColor(null); // Czyścimy kolor przy wyborze numeru
        setSelectedNumber(val);
        setKomunikat(`Obstawiono numer: ${val}`);
    };

    const spin = async () => {
        if (isSpinning) return;

        // WALIDACJA
        const numToBet = parseInt(selectedNumber);
        if (betType === 'number' && (selectedNumber === '' || isNaN(numToBet) || numToBet < 0 || numToBet > 36)) {
            setKomunikat('❌ Wpisz poprawny numer (0-36)!');
            return;
        }
        if (betType === 'color' && !selectedColor) {
            setKomunikat('❌ Wybierz kolor zakładu!');
            return;
        }
        if (betAmount === '' || betAmount === null) {
            setKomunikat('❌ Wpisz stawkę przed zagraniem!');
            return;
        }

        const numericBet = parseInt(betAmount, 10);
        if (isNaN(numericBet) || numericBet < 10 || user.points < numericBet) {
            setKomunikat('❌ Za mało punktów lub błędna stawka!');
            return;
        }

        setIsSpinning(true);
        setKomunikat('🎰 Losowanie w toku...');

        const gameParams = betType === 'color'
            ? { betType, selectedColor }
            : { betType, selectedNumber: numToBet };

        try {
            const res = await fetch('http://localhost:8080/api/game/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    gameName: 'Roulette',
                    betAmount: numericBet,
                    gameParams: gameParams
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setKomunikat(`❌ Błąd: ${data.message}`);
                setIsSpinning(false);
                return;
            }

            // Dane wylosowane bezpiecznie na serwerze
            const winningNum = data.gameData.winningNumber;
            const colorWin = data.gameData.color;

            // OBLICZANIE ROTACJI NA PODSTAWIE WYNIKU Z SERWERA
            const randomIndex = W.indexOf(winningNum);
            const targetAngle = (randomIndex * DEGREES_PER_SEGMENT) + (DEGREES_PER_SEGMENT / 2);
            const currentRotationNormalized = wheelRotation % 360;
            const spins = 360 * 10;
            const finalRotation = wheelRotation - spins - (targetAngle + currentRotationNormalized);

            setWheelRotation(finalRotation);

            // OCZEKIWANIE NA ZAKOŃCZENIE ANIMACJI KOŁA (4 sekundy)
            setTimeout(() => {
                syncPoints(data.newPoints);
                setWynik(winningNum);
                if (data.won) {
                    setKomunikat(`🎉 WYGRANA! Wypadło ${winningNum} (${colorWin.toUpperCase()}). +${data.payout} pkt!`);
                } else {
                    setKomunikat(`💀 Przegrana. Wypadło ${winningNum} (${colorWin.toUpperCase()}).`);
                }

                setIsSpinning(false);
            }, 4000);

        } catch (err) {
            console.error("Błąd komunikacji z serwerem gier:", err);
            setKomunikat("❌ Brak połączenia z serwerem gier!");
            setIsSpinning(false);
        }
    };

    const styles = {
        container: { padding: '20px', textAlign: 'center', color: 'white', background: '#0a0f1e', minHeight: '100vh',
            fontFamily: 'Arial, sans-serif' },

        stage: { position: 'relative', width: '320px', height: '320px', margin: '30px auto', borderRadius: '50%',
            border: '10px solid #d4af37', boxShadow: '0 0 50px rgba(0,0,0,0.8)' },

        indicator: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: 0,
            height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
            borderTop: '30px solid gold', zIndex: 100 },

        wheel: { width: '100%', height: '100%', position: 'relative', borderRadius: '50%',
            transition: 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)', transform: `rotate(${wheelRotation}deg)`,
            background: `conic-gradient(${generatedGradient})` },

        center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80px',
            height: '80px', background: '#111', borderRadius: '50%', border: '4px solid gold', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'gold' },

        numberWrapper: (i) => ({
            position: 'absolute', top: '50%', left: '50%', height: '145px', transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${i * DEGREES_PER_SEGMENT + DEGREES_PER_SEGMENT / 2}deg)`,
            paddingTop: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: 'white', pointerEvents: 'none'
        }),
        controls: { maxWidth: '500px', margin: '0 auto', padding: '20px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '15px', border: '1px solid rgba(255,215,0,0.2)' },
        input: { padding: '10px', background: '#111', color: 'white', border: '1px solid #444', borderRadius: '8px',
            width: '70px', textAlign: 'center', fontSize: '1rem' }
    };

    return (
        <div style={styles.container}>
            <h2 style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>🎡Roulette</h2>
            <p style={{ color: 'gold', fontSize: '1.2rem' }}>💰 Saldo: {user.points} pkt</p>

            {/* KOŁO RULETKI */}
            <div style={styles.stage}>
                <div style={styles.indicator}></div>
                <div style={styles.center}>{isSpinning ? '?' : (wynik !== null ? wynik : '—')}</div>
                <div style={styles.wheel}>
                    {W.map((num, i) => (
                        <div key={i} style={styles.numberWrapper(i)}>{num}</div>
                    ))}
                </div>
            </div>

            {/* PANEL STEROWANIA */}
            <div style={styles.controls}>
                {/* PRZYCISKI KOLORÓW */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button onClick={() => selectColorBet('red')} style={{
                        flex: 1, padding: '12px', background: '#d00', color: 'white', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 'bold', border: selectedColor === 'red' &&
                        betType === 'color' ? '3px solid gold' : 'none'
                    }}>Czerwone</button>
                    <button onClick={() => selectColorBet('black')} style={{
                        flex: 1, padding: '12px', background: '#111', color: 'white', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 'bold', border: selectedColor === 'black' &&
                        betType === 'color' ? '3px solid gold' : 'none'
                    }}>Czarne</button>
                    <button onClick={() => selectColorBet('green')} style={{
                        flex: 1, padding: '12px', background: '#0a0', color: 'white', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 'bold', border: selectedColor === 'green' &&
                        betType === 'color' ? '3px solid gold' : 'none'
                    }}>Zielone</button>
                </div>

                {/* OBSTAWIANIE NUMERU */}
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span>Postaw na numer (0-36):</span>
                    <input
                        type="number" min="0" max="36" placeholder="?"
                        value={selectedNumber}
                        onChange={(e) => selectNumberBet(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={{
                            ...styles.input,
                            borderColor: betType === 'number' ? 'gold' : '#444',
                            boxShadow: betType === 'number' ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
                        }}
                    />
                </div>

                {/* STAWKA */}
                <div style={{ marginBottom: '20px' }}>
                    <span>Stawka (min. 10):</span>
                    <input
                        type="number" min="10"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={{ ...styles.input, width: '100px', marginLeft: '10px' }}
                    />
                </div>

                {/* PRZYCISK STARTU */}
                <button
                    onClick={spin} disabled={isSpinning || betAmount === ''}
                    style={{
                        width: '100%', padding: '16px', background: 'linear-gradient(gold, #b8860b)', color: 'black',
                        fontWeight: '900', border: 'none', borderRadius: '12px', cursor: betAmount === '' ? 'not-allowed' : 'pointer',
                        opacity: (isSpinning || betAmount === '') ? 0.5 : 1, fontSize: '1.1rem'
                    }}
                >
                    {isSpinning ? 'KRĘCENIE...' : 'ZAGRAJ'}
                </button>

                <p style={{ marginTop: '15px', color: 'gold', fontWeight: 'bold', minHeight: '1.2em' }}>{komunikat}</p>
            </div>
        </div>
    );
};

export default Roulette;