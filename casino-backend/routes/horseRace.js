const express = require('express');
const { getRaceState, placeBet } = require('../game_logic/horseRace/horseRaceEngine');

const router = express.Router();

router.get('/horse-race/current', async (req, res) => {
  const username = req.query.username; 
  try {
      const raceState = await getRaceState(username);
      res.json({
        success: true,
        raceState: raceState,
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Błąd serwera.' });
  }
});

router.post('/horse-race/current/bet', async (req, res) => {
  const { username, horseId, stake, odds } = req.body;

  if (!username || !horseId || !stake || !odds) {
    return res.status(400).json({
      success: false,
      error: 'Brakuje wymaganych danych zakładu.',
    });
  }

  try {
      const result = await placeBet(username, {
        horseId,
        stake: Number(stake),
        odds: Number(odds),
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Błąd serwera.' });
  }
});

module.exports = router;
