const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Importujemy silniki gier
const evaluateSlots = require('../game_logic/slots/slotsEngine');
const evaluateRoulette = require('../game_logic/roulette/rouletteEngine');

// Słownik (mapowanie) nazw gier na ich funkcje logiczne
const GAMES_REGISTRY = {
    'Slots': evaluateSlots,
    'Roulette': evaluateRoulette
    // 'HorseRace': evaluateHorseRace
};

// JEDEN ENDPOINT DLA WSZYSTKICH GIER HTTP
router.post('/game/play', async (req, res) => {
    const { username, gameName, betAmount, gameParams } = req.body;
    try {
        // 1. Sprawdzenie czy gra istnieje w systemie
        const gameEngine = GAMES_REGISTRY[gameName];
        if (!gameEngine) {
            return res.status(400).json({ message: "Nieznana gra!" });
        }

        const numericBet = parseInt(betAmount, 10);
        if (isNaN(numericBet) || numericBet < 10) {
            return res.status(400).json({ message: "Niepoprawna stawka (min. 10)!" });
        }

        // 2. Pobranie i weryfikacja punktów użytkownika bezpośrednio z bazy danych
        const userRes = await pool.query('SELECT id, points FROM users WHERE username = $1', [username]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "Użytkownik nie znaleziony" });
        }

        const user = userRes.rows[0];
        if (user.points < numericBet) {
            return res.status(400).json({ message: "Za mało punktów!" });
        }

        // 3. BEZPIECZNE ODALENIE LOGIKI GRY NA BACKENDZIE
        // Przekazujemy stawkę i dodatkowe parametry (np. wybrane numery/kolory)
        const result = gameEngine(numericBet, gameParams || {});

        // 4. Kalkulacja zmiany salda w bazie danych (wypłata minus stawka)
        const diff = result.payout - numericBet;
        const updateRes = await pool.query(
            'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points',
            [diff, user.id]
        );

        // 5. Automatyczny zapis do historii zakładów 'bets' dla dowolnej gry!
        await pool.query(
            'INSERT INTO bets (user_id, game_name, bet_amount, payout, won) VALUES ($1, $2, $3, $4, $5)',
            [user.id, gameName, numericBet, result.payout, result.won]
        );

        // 6. Odesłanie wyniku – frontend dostaje dane losowania i nowe punkty
        res.json({
            success: true,
            won: result.won,
            payout: result.payout,
            newPoints: updateRes.rows[0].points,
            gameData: result.gameData // np. bębny dla slotów, albo numer dla ruletki
        });

    } catch (err) {
        console.error("Błąd w ujednoliconym endpoincie gry:", err);
        res.status(500).json({ message: "Błąd serwera podczas rozgrywki" });
    }
});

module.exports = router;