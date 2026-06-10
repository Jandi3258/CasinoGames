const SYMBOL_CONFIG = [
    { img: '🍒', mult: 5, weight: 40 },
    { img: '🍋', mult: 10, weight: 30 },
    { img: '🔔', mult: 25, weight: 15 },
    { img: '💎', mult: 60, weight: 10 },
    { img: '⭐', mult: 150, weight: 5 },
];

const weightedSymbols = SYMBOL_CONFIG.flatMap(s => Array(s.weight).fill(s));
const getRandomSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];

function evaluateSlots(betAmount, params = {}) {
    const s1 = getRandomSymbol();
    const s2 = getRandomSymbol();
    const s3 = getRandomSymbol();

    let payout = 0;
    let won = false;

    if (s1.img === s2.img && s2.img === s3.img) {
        payout = betAmount * s1.mult;
        won = true;
    } else if (
        (s1.img === s2.img || s2.img === s3.img || s1.img === s3.img)
        && Math.random() < (typeof params.pairWinProbability === 'number' ? params.pairWinProbability : 0.1)
    ) {
        payout = Math.floor(betAmount * (typeof params.pairPayoutMultiplier === 'number' ? params.pairPayoutMultiplier : 2.5));
        won = true;
    }

    return {
        won,
        payout,
        gameData: { reels: [s1.img, s2.img, s3.img] } // dane potrzebne tylko dla oka na frontendzie
    };
}

module.exports = evaluateSlots;