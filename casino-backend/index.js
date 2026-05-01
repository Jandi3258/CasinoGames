// SERCE SERWERA NOWE FUNKCJE ITD PANOWIE
const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Potrzebne do obsługi pliku JSON
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';

// Pomocnicza funkcja: Czytanie bazy z pliku
const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]'); // Stwórz plik, jeśli go nie ma
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};

// Pomocnicza funkcja: Zapis do pliku
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- ENDPOINTY SYSTEMU KONT ---

// Rejestracja
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Ten login jest już zajęty!' });
    }

    const newUser = { username, password, points: 1000 }; // Użytkownik zaczyna z 1000 punktów
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'Konto utworzone!', user: newUser });
});

// Logowanie
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Błędny login lub hasło!' });
    }

    res.json({ message: 'Zalogowano pomyślnie!', user });
});

// Endpoint do aktualizacji punktów
app.post('/api/update-points', (req, res) => {
    const { username, amount } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex !== -1) {
        users[userIndex].points += amount; // amount może być ujemny (np. -10) lub dodatni (np. +50)
        writeUsers(users);
        res.json({ success: true, newPoints: users[userIndex].points });
    } else {
        res.status(404).json({ message: "Użytkownik nie znaleziony" });
    }
});

app.post("/api/deposit", (req, res) => {
    const { username, packageId } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
    }

    const packages = {
        small: { points: 100, cost: 10 },
        medium: { points: 500, cost: 50 },
        large: { points: 1000, cost: 100 }
    };

    if (!packages[packageId]) {
        return res.status(400).json({ message: "Nieprawidlowy pakiet" });
    }

    users[userIndex].points += packages[packageId].points;
    writeUsers(users);

    res.json({ success: true, newPoints: users[userIndex].points, message: "Dodano " + packages[packageId].points + " punktow" });
});

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

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Backend działa na http://localhost:${PORT}`));