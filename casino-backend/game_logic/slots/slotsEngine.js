const SYMBOL_CONFIG = [
    // more uniform weights to reduce raw pair frequency (~30-40%)
    { img: '🍒', mult: 5, weight: 20 },
    { img: '🍋', mult: 10, weight: 20 },
    { img: '🔔', mult: 25, weight: 20 },
    { img: '💎', mult: 60, weight: 20 },
    { img: '⭐', mult: 150, weight: 20 },
];

const weightedSymbols = SYMBOL_CONFIG.flatMap(s => Array(s.weight).fill(s));
const getRandomSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];

function sampleWeightedSymbol(excludeImgs) {
    if (!excludeImgs || excludeImgs.size === 0) return getRandomSymbol();
    const pool = weightedSymbols.filter(s => !excludeImgs.has(s.img));
    if (pool.length === 0) return getRandomSymbol();
    return pool[Math.floor(Math.random() * pool.length)];
}

function evaluateSlots(betAmount, params = {}) {
    // outcome-first mode: first sample outcome category, then generate symbols consistent with it
    const useOutcomeFirst = params.outcomeFirst !== false; // default: outcome-first enabled
    if (useOutcomeFirst) {
        const probThree = typeof params.probThree === 'number' ? params.probThree : 0.04; // default ~4%
        const probPair = typeof params.probPair === 'number' ? params.probPair : 0.35; // default ~35% pair-only
        const probNone = Math.max(0, 1 - probThree - probPair);

        const r = Math.random();
        let reels;
        let payout = 0;
        let won = false;

        if (r < probThree) {
            const s = getRandomSymbol();
            reels = [s.img, s.img, s.img];
            payout = betAmount * s.mult;
            won = true;
        } else if (r < probThree + probPair) {
            const pairSym = getRandomSymbol();
            const exclude = new Set([pairSym.img]);
            const odd = sampleWeightedSymbol(exclude);
            // place odd one at random position
            const oddIndex = Math.floor(Math.random() * 3);
            reels = [];
            for (let i = 0; i < 3; i++) {
                reels[i] = (i === oddIndex) ? odd.img : pairSym.img;
            }
            payout = Math.floor(betAmount * (typeof params.pairPayoutMultiplier === 'number' ? params.pairPayoutMultiplier : 2.5));
            won = true;
        } else {
            // none: generate three distinct symbols
            const s1 = getRandomSymbol();
            const s2 = sampleWeightedSymbol(new Set([s1.img]));
            const s3 = sampleWeightedSymbol(new Set([s1.img, s2.img]));
            reels = [s1.img, s2.img, s3.img];
            payout = 0;
            won = false;
        }

        return {
            won,
            payout,
            gameData: { reels }
        };
    }

    // legacy behavior (reel-first sampling)
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
        && Math.random() < (typeof params.pairWinProbability === 'number' ? params.pairWinProbability : 1)
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