// index.js
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const initDb = require('./models/initDb');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const paymentRoutes = require('./routes/payment');
const horseRaceRoutes = require('./routes/horseRace');

const WebSocket = require('ws');
const http = require('http');
const GameSession = require('./game_logic/blackjack/gameSession');

const corsOptions = {
    origin: 'http://localhost:5173' // mi nie dziala bez explicit pozwolenia na cross url
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Inicjalizacja bazy
initDb();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'casino_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
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
const BLACKJACK_PORT = 6583;
server.listen(BLACKJACK_PORT, () => console.log(`Blackjack na porcie ${BLACKJACK_PORT}`));
// Podłączenie modułów
app.use('/api', authRoutes);
app.use('/api', gameRoutes);
app.use('/api', paymentRoutes);
app.use('/api', horseRaceRoutes);

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Serwer modułowy działa na porcie ${PORT}`));