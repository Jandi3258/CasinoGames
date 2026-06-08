// index.js
const express = require('express');
const cors = require('cors');
const initDb = require('./models/initDb');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const paymentRoutes = require('./routes/payment');
const horseRaceRoutes = require('./routes/horseRace');

const fs = require('fs');
const http = require('http');
const { setupBlackjackSocketHandler } = require('./game_logic/blackjack/socketHandler');

const corsOptions = {
    origin: 'http://localhost:5173' // mi nie dziala bez explicit pozwolenia na cross url
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Inicjalizacja bazy
initDb();

//blackjack ================
const blackjackURL = '/game/blackjack-game';
const server = http.createServer(app);

setupBlackjackSocketHandler({
    server,
    path: blackjackURL,
});

const path = require('path');
const website_server = express();
// The server can provide access to the frontend locally as well
// Requires the full built project in the Website/ folder
// Run the frontend locally: set frontend_local=true before starting the server.
// Do not run the frontend locally: leave frontend_local unset or set it to false.
const frontendLocal = String(process.env.frontend_local || '').toLowerCase() === 'true';

website_server.use(express.static(path.join(__dirname, 'Website')));

website_server.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'Website', 'index.html'));
});

website_server.use((req, res) => {
  res.redirect('/');
});

const WEBSITE_PORT = 5173;
if (frontendLocal) {
  website_server.listen(WEBSITE_PORT, () => console.log(`Website active on port ${WEBSITE_PORT}`));
}

// Podłączenie modułów
app.use('/api', authRoutes);
app.use('/api', gameRoutes);
app.use('/api', paymentRoutes);
app.use('/api', horseRaceRoutes);

const PORT = 8080;
server.listen(PORT, () => console.log(`🚀 Serwer modułowy działa na porcie ${PORT}`));