const express = require('express');
const { getRaceState, placeBet } = require('../game_logic/horseRace/horseRaceEngine');

const router = express.Router();


router.get('/horse-race/current', (req, res) => {
  
  const userId = 'user123'; 
  const raceState = getRaceState(userId);

  res.json({
    success: true,
    raceState: raceState,
  });
});


router.post('/horse-race/current/bet', (req, res) => {
  
  const userId = 'user123'; 
  const { horseId, stake, odds } = req.body;

  if (!horseId || !stake || !odds) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: horseId, stake, odds',
    });
  }

  const result = placeBet(userId, {
    horseId,
    stake: Number(stake),
    odds: Number(odds),
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

module.exports = router;
