const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/deposit', async (req, res) => {
    const { username, packageId } = req.body;
    const packages = {
        small: { points: 100, cost: 10 },
        medium: { points: 500, cost: 50 },
        large: { points: 1000, cost: 100 },
        p500: { points: 5000, cost: 500 },
        p1000: { points: 10000, cost: 1000 },
        p2500: { points: 25000, cost: 2500 },
        xlarge: { points: 100000, cost: 10000 }
    };

    const selected = packages[packageId];
    if (!selected) return res.status(400).json({ message: "Błędny pakiet" });

    try {
        // Dodaj punkty użytkownikowi
        const userUpdate = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING id, points',
            [selected.points, username]
        );

        if (userUpdate.rows.length === 0) {
            return res.status(404).json({ message: "Użytkownik nie znaleziony" });
        }

        const userId = userUpdate.rows[0].id;

        // Zapisz rekord doładowania w nowej tabeli
        await pool.query(
            'INSERT INTO deposits (user_id, package_name, amount_points, cost_pln) VALUES ($1, $2, $3, $4)',
            [userId, packageId, selected.points, selected.cost]
        );

        res.json({
            success: true,
            newPoints: userUpdate.rows[0].points
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd podczas procesowania płatności" });
    }
});

module.exports = router;