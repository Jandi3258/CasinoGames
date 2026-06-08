const WebSocket = require('ws');
const pool = require('../../config/db');
const GameSession = require('./gameSession');

function blackjackSessionId() {
    return `blackjack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function alterPlayerTokens(pool, { username, amount }) {
    try {
        if (amount === 0) {
            const result = await pool.query(
                'SELECT points FROM users WHERE username = $1',
                [username]
            );

            if (result.rows.length > 0) {
                return { success: true, newPoints: result.rows[0].points };
            }

            return { success: false, error: 'Użytkownik nie znaleziony' };
        }

        const result = await pool.query(
            'UPDATE users SET points = points + $1 WHERE username = $2 RETURNING points',
            [amount, username]
        );

        if (result.rows.length > 0) {
            return { success: true, newPoints: result.rows[0].points };
        }

        return { success: false, error: 'Użytkownik nie znaleziony' };
    } catch (err) {
        console.error('DB error in alterPlayerTokens:', err);
        return { success: false, error: 'Błąd przy aktualizacji punktów' };
    }
}

class BetLogger {
    constructor(userId) {
        this.userId = userId;
        this.betState = {
            active: false,
            totalStake: 0,
            totalPayout: 0,
        };
    }

    async recordFinalBet(forceLoss = false) {
        if (!this.betState.active) {
            return;
        }
        this.betState.active = false;

        const betAmount = this.betState.totalStake;
        const payout = this.betState.totalPayout;
        const won = payout >= betAmount;

        await pool.query(
            'INSERT INTO bets (user_id, game_name, bet_amount, payout, won) VALUES ($1, $2, $3, $4, $5)',
            [this.userId, 'Blackjack', betAmount, payout, won]
        );
    };
    async logBet(phase, options = {}) {
        if (phase === 'BEGIN') {
            this.betState.active = true;
            this.betState.totalStake = 0;
            this.betState.totalPayout = 0;
            return;
        }

        if (phase === 'END') {
            await this.recordFinalBet(options);
        }
    };
    async trackTokenChange(payload) {
        const result = await alterPlayerTokens(pool, payload);

        if (this.betState.active && result.success && payload.amount !== 0) {
            if (payload.amount < 0) {
                this.betState.totalStake += Math.abs(payload.amount);
            } else {
                this.betState.totalPayout += payload.amount;
            }
        }

        return result;
    };
    async forceLoss() {
        await this.recordFinalBet(true);
    };
    isActive() {
        return this.betState.active;
    }
}

function setupBlackjackSocketHandler({ server, path }) {
    const blackjackSessions = new Map();
    const wss = new WebSocket.Server({ server, path });

    wss.on('connection', (ws) => {
        const sessionId = blackjackSessionId();
        let gameSession = null;
        let betLogger = null;

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
                return;
            }

            if (gameSession !== null) {
                await gameSession.handleAction(data, ws);
                return;
            }

            const { msg, username } = data;
            if (msg !== 'PLAYER-INIT' || !username) {
                ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
                ws.close();
                return;
            }

            try {
                const result = await pool.query('SELECT id, points FROM users WHERE username = $1', [username]);
                if (result.rows.length === 0) {
                    ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
                    ws.close();
                    return;
                }

                const userId = result.rows[0].id;
                betLogger = new BetLogger( userId );

                const session = new GameSession(
                    sessionId,
                    username,
                    (payload) => betLogger.trackTokenChange(payload),
                    (...args) => betLogger.logBet(...args),
                );

                await session.init();
                gameSession = session;
                blackjackSessions.set(sessionId, { ws, gameSession });
            } catch (err) {
                console.error('Error validating player init:', err);
                ws.send(JSON.stringify({ action: 'ERROR', message: "Couldn't find user." }));
                ws.close();
            }
        });

        ws.on('close', () => {
            if (betLogger && betLogger.isActive()) {
                betLogger.forceLoss().catch((error) => {
                    console.error('Error finalizing active blackjack bet on close:', error);
                });
            }
            blackjackSessions.delete(sessionId);
            console.log(`Player disconnected: ${sessionId}`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    return { wss, blackjackSessions };
}

module.exports = { setupBlackjackSocketHandler };