// index.js
const express = require('express');
const cors = require('cors');
const initDb = require('./models/initDb');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const paymentRoutes = require('./routes/payment');

const app = express();
app.use(cors());
app.use(express.json());

// Inicjalizacja bazy
initDb();

// Podłączenie modułów
app.use('/api', authRoutes);
app.use('/api', gameRoutes);
app.use('/api', paymentRoutes);

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Serwer modułowy działa na porcie ${PORT}`));