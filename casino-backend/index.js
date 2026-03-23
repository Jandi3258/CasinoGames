// SERCE SERWERA NOWE FUNKCJE ITD PANOWIE
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Prosta informacja, że kasyno działa
app.get('/', (req, res) => {
    res.send('🎰 Witamy w serwerze Kasyna! Logika działa.');
});

// Endpoint dla Twojego UI - lista gier
app.get('/api/games', (req, res) => {
    res.json([
        { id: 'farmer', name: 'Super Farmer', icon: '🚜' },
        { id: 'ruletka', name: 'Ruletka', icon: '🎡' }
    ]);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend działa na http://localhost:${PORT}`));