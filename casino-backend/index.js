require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Konfiguracja połączenia z bazą danych
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'casino_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// 2. Inicjalizacja tabeli (wykonuje się raz przy starcie serwera)
const initDb = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      points INTEGER DEFAULT 1000
    );
  `;
    try {
        await pool.query(query);
        console.log("✅ Tabela 'users' jest gotowa w PostgreSQL.");
    } catch (err) {
        console.error("❌ Błąd inicjalizacji bazy:", err);
    }
};
initDb();

// --- ENDPOINTY SYSTEMU KONT ---

// REJESTRACJA (z szyfrowaniem hasła)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Szyfrujemy hasło przed zapisem
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, points',
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'Konto utworzone!', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Ten login jest już zajęty lub wystąpił błąd bazy!' });
    }
});

// LOGOWANIE (z weryfikacją szyfrowanego hasła)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Błędny login lub hasło!' });
        }

        const user = result.rows[0];

        // Sprawdzamy czy wpisane hasło pasuje do hashu w bazie
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: 'Błędny login lub hasło!' });
        }

        // Nie wysyłamy hasła do frontendu
        const { password: _, ...userSafe } = user;
        res.json({ message: 'Zalogowano pomyślnie!', user: userSafe });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera przy logowaniu' });
    }
});

// AKTUALIZACJA PUNKTÓW (bezpośrednio w bazie SQL)
app.post('/api/update-points', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING points',
            [amount, username]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, newPoints: result.rows[0].points });
        } else {
            res.status(404).json({ message: "Użytkownik nie znaleziony" });
        }
    } catch (err) {
        res.status(500).json({ message: "Błąd przy aktualizacji punktów" });
    }
});

// DEPOZYT (Pakiety punktów)
app.post("/api/deposit", async (req, res) => {
    const { username, packageId } = req.body;
    const packages = {
        small: 100,
        medium: 500,
        large: 1000
    };

    if (!packages[packageId]) {
        return res.status(400).json({ message: "Nieprawidłowy pakiet" });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING points',
            [packages[packageId], username]
        );
        res.json({
            success: true,
            newPoints: result.rows[0].points,
            message: `Dodano ${packages[packageId]} punktów`
        });
    } catch (err) {
        res.status(500).json({ message: "Błąd depozytu" });
    }
});

app.get('/', (req, res) => {
    res.send('🎰 Witamy w serwerze Kasyna! Postgres i Bcrypt działają.');
});

app.get('/api/games', (req, res) => {
    res.json([
        { id: 'farmer', name: 'Super Farmer', icon: '🚜' },
        { id: 'ruletka', name: 'Ruletka', icon: '🎡' }
    ]);
});

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Backend działa na http://localhost:${PORT} (Postgres Mode)`));