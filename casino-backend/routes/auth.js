const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_this';

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, points',
            [username, hashedPassword]
        );
        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        res.status(400).json({ message: "Użytkownik już istnieje." });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const { password: _, ...safeUser } = user;
                const token = jwt.sign({ id: safeUser.id, username: safeUser.username }, JWT_SECRET, { expiresIn: '7d' });
                return res.json({ user: safeUser, token });
            }
        }
        res.status(401).json({ message: "Błędny login lub hasło." });
    } catch (err) {
        res.status(500).json({ message: "Błąd serwera." });
    }
});

module.exports = router;