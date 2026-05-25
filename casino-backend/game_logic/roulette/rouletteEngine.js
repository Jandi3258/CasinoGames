const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Możesz dostosować tę stałą aby zmniejszyć (wartość < 1) lub zwiększyć (wartość > 1)
// rzeczywistą szansę trafienia koloru. 1.0 = brak modyfikacji. 0.6 = 60% oryginalnej szansy.
const COLOR_WIN_RATE = process.env.RULETTE_COLOR_WIN_RATE ? Number(process.env.RULETTE_COLOR_WIN_RATE) : 0.6;

function evaluateRoulette(betAmount, params) {
    const { betType, selectedColor, selectedNumber } = params;

    const randomIndex = Math.floor(Math.random() * WHEEL.length);
    const winningNum = WHEEL[randomIndex];

    let colorWin = 'black';
    if (winningNum === 0) colorWin = 'green';
    else if (RED_NUMBERS.includes(winningNum)) colorWin = 'red';

    let won = false;
    let payout = 0;

    if (betType === 'color' && selectedColor === colorWin) {
        // Jeśli kolor się zgadza — dodatkowe losowanie decyduje czy trafienie jest uznane.
        // Pozwala to na zmniejszenie rzeczywistej częstotliwości wygranych przy zakładach kolor.
        const pass = Math.random() < COLOR_WIN_RATE;
        if (pass) {
            won = true;
            payout = betAmount * (selectedColor === 'green' ? 36 : 2);
        } else {
            // nie uznajemy trafienia — traktujemy jako przegraną (payout pozostaje 0)
            won = false;
            payout = 0;
        }
    } else if (betType === 'number' && parseInt(selectedNumber) === winningNum) {
        won = true;
        payout = betAmount * 36;
    }

    return {
        won,
        payout,
        gameData: { winningNumber: winningNum, color: colorWin }
    };
}

module.exports = evaluateRoulette;