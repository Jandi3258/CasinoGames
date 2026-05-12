require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const WebSocket = require('ws');
const http = require('http');
const GameSession = require('./game_logic/blackjack/gameSession');

const corsOptions = {
    origin: 'http://localhost:5173' // mi nie dziala bez explicit pozwolenia na cross url
}

const app = express();
app.use(cors(corsOptions));
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
        large: 1000,
        p500: 5000,
        p1000: 10000,
        p2500: 25000,
        xlarge: 100000
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

//blackjack ================
const blackjackURL = '/game/blackjack-game';
const blackjackSessions = new Map();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: blackjackURL });

async function alterPlayerTokens({ username, amount }) {
    try {
        if (amount === 0) {
            const result = await pool.query(
                'SELECT points FROM users WHERE username = $1',
                [username]
            );
            console.log("AAA");
            if (result.rows.length > 0) {
                console.log({ success: true, newPoints: result.rows[0].points });
                return { success: true, newPoints: result.rows[0].points };
            } else {
                return { success: false, error: 'Użytkownik nie znaleziony' };
            }
        } else {
            const result = await pool.query(
                'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING points',
                [amount, username]
            );

            if (result.rows.length > 0) {
                return { success: true, newPoints: result.rows[0].points };
            } else {
                return { success: false, error: 'Użytkownik nie znaleziony' };
            }
        }
    } catch (err) {
        console.error('DB error in alterPlayerTokens:', err);
        return { success: false, error: 'Błąd przy aktualizacji punktów' };
    }
}

function blackjack_sessionId() {
    return `blackjack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

wss.on('connection', (ws) => {
    const sessionId = blackjack_sessionId();
    var gameSession = null;//new GameSession(sessionId, alterPlayerTokens);
    blackjackSessions.set(sessionId, { ws, gameSession });

    console.log(`New player connected: ${sessionId}`);

    ws.send(JSON.stringify({
        action: 'INIT',
        sessionId,
    }));

    ws.on('message', async (message) => {
        console.log(message);

        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({ action: 'ERROR', message: 'Invalid message format' }));
        }

        if ( gameSession !== null ) {
            await gameSession.handleAction(data, ws);
            return;
        } 
        
        // VERIFY USER, FIRST CONNECTION
        const { msg, username } = data;
        if (msg !== 'PLAYER-INIT' || !username) {
            ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
            return ws.close();
        }

        // verify user exists in database
        try {
            const result = await pool.query('SELECT id, points FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0) {
                ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
                ws.close();
                return;
            }
            const initialPoints = result.rows[0].points;

            // OBSOLETE
            const asyncWrap = async ( nick, amount ) => {
                return await alterPlayerTokens({username: nick, amount});
            }

            temp = new GameSession(sessionId, username, alterPlayerTokens);
            await temp.init();
            gameSession = temp;
            blackjackSessions.set(sessionId, { ws, gameSession });
        } catch (err) {
            console.error('Error validating player init:', err);
            ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
            ws.close();
            return;
        }
    });

    ws.on('close', () => {
        blackjackSessions.delete(sessionId);
        console.log(`Player disconnected: ${sessionId}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
//==========================

const PORT = 8080;
server.listen(PORT, () => console.log(`🚀 Backend działa na http://localhost:${PORT} (Postgres Mode)`));