const express = require('express');
const router = express.Router();
const pool = require('../config/db');


const PACKAGES_CONFIG = {
    small: { points: 100, cost: 10 },
    medium: { points: 500, cost: 50 },
    large: { points: 1000, cost: 100 },
    p500: { points: 5000, cost: 500 },
    p1000: { points: 10000, cost: 1000 },
    p2500: { points: 25000, cost: 2500 },
    xlarge: { points: 100000, cost: 10000 }
};

router.get('/packages', (req, res) => {
    res.json(PACKAGES_CONFIG);
});

router.post('/deposit', async (req, res) => {
    const { username, packageId, cardDetails } = req.body;

    const selected = PACKAGES_CONFIG[packageId];
    if (!selected) return res.status(400).json({ message: "Wybrany pakiet nie istnieje!" });

    if (!cardDetails || !cardDetails.number || cardDetails.number.length !== 16) {
        return res.status(400).json({ message: "Odrzucenie transakcji: Niepoprawny numer karty!" });
    }
    if (!cardDetails.expiry || !cardDetails.expiry.includes('/')) {
        return res.status(400).json({ message: "Odrzucenie transakcji: Błędna data ważności!" });
    }
    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
        return res.status(400).json({ message: "Odrzucenie transakcji: Nieprawidłowy kod CVV!" });
    }

    try {
        const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "Użytkownik nie odnaleziony w bazie!" });
        }
        const userId = userCheck.rows[0].id;

        const userUpdate = await pool.query(
            'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points',
            [selected.points, userId]
        );

        await pool.query(
            'INSERT INTO deposits (user_id, package_name, amount_points, cost_pln) VALUES ($1, $2, $3, $4)',
            [userId, packageId, selected.points, selected.cost]
        );

        res.json({
            success: true,
            message: `Bank autoryzował płatność. Zasilono konto kwotą +${selected.points} pkt!`,
            newPoints: userUpdate.rows[0].points
        });

    } catch (err) {
        console.error("Błąd serwera podczas depozytu:", err);
        res.status(500).json({ message: "Błąd krytyczny serwera bankowego." });
    }
});

module.exports = router;