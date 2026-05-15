const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/place-bet', async (req, res) => {
    const { username, betAmount, payout, won, gameName } = req.body;
    try {
        const userRes = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING id, points',
            [payout, username]
        );

        const userId = userRes.rows[0].id;

        await pool.query(
            'INSERT INTO bets (user_id, game_name, bet_amount, payout, won) VALUES ($1, $2, $3, $4, $5)',
            [userId, gameName, betAmount, payout, won]
        );

        res.json({ success: true, newPoints: userRes.rows[0].points });
    } catch (err) {
        res.status(500).json({ message: "Błąd zapisu zakładu" });
    }
});

router.post('/update-balance-only', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING points',
            [amount, username]
        );
        res.json({ newPoints: result.rows[0].points });
    } catch (err) {
        res.status(500).json({ message: "Błąd bazy danych" });
    }
});

module.exports = router;