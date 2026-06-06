const horses = [
  {
    id: 'h1',
    name: 'Szybki Paweł',
    odds: 2.8,
    color: '#E11D48',
    history: ['1st', '3rd', '2nd', '1st', '4th'],
  },
  {
    id: 'h2',
    name: 'Pan Kopytnik',
    odds: 3.2,
    color: '#2563EB',
    history: ['4th', '2nd', '1st', '3rd', '2nd'],
  },
  {
    id: 'h3',
    name: 'Rumak Rysiek',
    odds: 4.5,
    color: '#F59E0B',
    history: ['2nd', '5th', '3rd', '2nd', '1st'],
  },
  {
    id: 'h4',
    name: 'Koń Jurka',
    odds: 5.6,
    color: '#0F766E',
    history: ['3rd', '4th', '2nd', '5th', '3rd'],
  },
  {
    id: 'h5',
    name: 'Dziki Dyzek',
    odds: 6.8,
    color: '#7C3AED',
    history: ['5th', '1st', '4th', '3rd', '6th'],
  },
  {
    id: 'h6',
    name: 'Wolny Jakub',
    odds: 8.0,
    color: '#D97706',
    history: ['6th', '4th', '5th', '2nd', '3rd'],
  },
];

const phaseDurations = {
  betting: 30,
  racing: 30,
  'photo-finish': 3,
  results: 5,
};


const userBalances = {
  'user123': 1000,
};

let globalRace = {
  raceNumber: 1,
  phase: 'betting',
  timer: phaseDurations.betting,
  startTime: Date.now(),
  phaseStartTime: Date.now(),
  winnerId: null,
  order: null,
  bets: {},
  payouts: {},
};

const chooseWeightedHorse = () => {
  const houseEdge = 0.06;
  const weights = horses.map((horse) => ({
    horse,
    weight: 1 / horse.odds,
  }));

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const normalized = weights.map((item) => ({
    horse: item.horse,
    weight: item.weight / totalWeight,
  }));

  const pick = Math.random();
  let accumulator = 0;

  for (const entry of normalized) {
    accumulator += entry.weight * (1 - houseEdge);
    if (pick <= accumulator) {
      return entry.horse;
    }
  }

  return normalized[normalized.length - 1].horse;
};

const getRaceOrder = (winnerId) => {
  const winner = horses.find((horse) => horse.id === winnerId) ?? horses[0];
  const others = horses.filter((horse) => horse.id !== winner.id);
  return [winner, ...others];
};

const advanceGlobalRace = () => {
  const now = Date.now();
  let elapsed = Math.floor((now - globalRace.phaseStartTime) / 1000);

  
  while (elapsed >= phaseDurations[globalRace.phase]) {
    elapsed -= phaseDurations[globalRace.phase];
    globalRace.phaseStartTime += phaseDurations[globalRace.phase] * 1000;

    const nextPhases = {
      betting: 'racing',
      racing: 'photo-finish',
      'photo-finish': 'results',
      results: 'betting',
    };
    const nextPhase = nextPhases[globalRace.phase];

    if (nextPhase === 'racing') {
      const winner = chooseWeightedHorse();
      globalRace.winnerId = winner.id;
      globalRace.order = getRaceOrder(winner.id);
      
      globalRace.payouts = {};
      for (const userId in globalRace.bets) {
        const bet = globalRace.bets[userId];
        globalRace.payouts[userId] = bet.horseId === winner.id
          ? bet.stake * winner.odds * 0.94
          : 0;
      }
    }

    if (nextPhase === 'results') {
      for (const userId in globalRace.payouts) {
        const payout = globalRace.payouts[userId];
        if (payout > 0) {
          userBalances[userId] = (userBalances[userId] || 0) + payout;
          console.log(`✅ User ${userId} won ${payout} coins! New balance: ${userBalances[userId]}`);
        }
      }
    }

    if (nextPhase === 'betting') {
      if (globalRace.order) {
        globalRace.order.forEach((horse, index) => {
          let suffix = 'th';
          if (index === 0) suffix = 'st';
          else if (index === 1) suffix = 'nd';
          else if (index === 2) suffix = 'rd';
          
          const placement = `${index + 1}${suffix}`;
          const globalHorse = horses.find(h => h.id === horse.id);
          if (globalHorse) {
            globalHorse.history.unshift(placement);
            if (globalHorse.history.length > 5) {
              globalHorse.history.pop();
            }
          }
        });
      }

      globalRace.raceNumber += 1;
      globalRace.winnerId = null;
      globalRace.order = null;
      globalRace.payouts = {};
      globalRace.bets = {};
    }

    globalRace.phase = nextPhase;
  }

  globalRace.timer = Math.max(0, phaseDurations[globalRace.phase] - elapsed);
  
  return globalRace;
};

const getRaceState = (userId) => {
  const race = advanceGlobalRace();
  const userBet = race.bets[userId];
  
  return { 
    ...race,
    horses,
    outcome: race.winnerId ? {
      winnerId: race.winnerId,
      order: race.order,
      payout: race.payouts[userId] || 0,
    } : null,
    userBalance: userId ? userBalances[userId] : undefined,
    userBet,
  };
};

const placeBet = (userId, betData) => {
  const race = advanceGlobalRace();

  if (race.phase !== 'betting') {
    return { success: false, error: 'Betting is only allowed during the betting phase' };
  }

  if (race.bets[userId]) {
    return { success: false, error: 'You already have a bet placed on this race' };
  }

  if (!userBalances[userId] || userBalances[userId] < betData.stake) {
    return { success: false, error: 'Insufficient balance' };
  }

  userBalances[userId] -= betData.stake;
  race.bets[userId] = { ...betData, userId };

  return {
    success: true,
    betSlip: race.bets[userId],
    userBalance: userBalances[userId],
  };
};

module.exports = {
  horses,
  phaseDurations,
  getRaceState,
  placeBet,
  advanceGlobalRace,
  chooseWeightedHorse,
  getRaceOrder,
};
