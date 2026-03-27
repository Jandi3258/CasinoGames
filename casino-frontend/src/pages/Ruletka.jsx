// src/pages/Ruletka.jsx
import React, { useState } from 'react';

const Ruletka = ({ user, updatePoints }) => { // Odbieramy funkcje i dane użytkownika
    const [wynik, setWynik] = useState(null);
    const [bet, setBet] = useState(10); // Przykładowa stawka

    const losuj = async () => {
        // 1. Sprawdź czy użytkownika stać na grę
        if (user.points < bet) {
            alert("Nie masz wystarczającej liczby punktów!");
            return;
        }

        // 2. Pobierz "opłatę" za wejście (odejmij punkty)
        await updatePoints(-bet);

        // 3. Logika losowania
        const liczba = Math.floor(Math.random() * 37);
        setWynik(liczba);

        // 4. Sprawdź wygraną (np. wygrana jeśli wypadnie 7)
        if (liczba === 7) {
            alert("JACKPOT! Wygrałeś 100 pkt!");
            await updatePoints(100);
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2>🎡 Stół do Ruletki</h2>
            <p>Twoje saldo: {user.points} pkt</p>

            <div style={{ marginBottom: '10px' }}>
                <label>Stawka: </label>
                <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    style={{ width: '60px' }}
                />
            </div>

            <button onClick={losuj} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Kręć kołem (koszt: {bet} pkt)
            </button>

            {wynik !== null && <h3>Wypadło: {wynik}</h3>}
        </div>
    );
};

export default Ruletka;