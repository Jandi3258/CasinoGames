const Deck = require('./deck');
const debug_print = true;
class GameSession {
  constructor(sessionId, username, alterPlayerTokens) {
    this.sessionId = sessionId;
    this.username = username;
    this.playerTokens = 0; // this' initialization is validated inside ws
    this.alterPlayerTokens = alterPlayerTokens;
    this.currentBet = 0;
    this.deck = new Deck();
    this.playerHand = [];
    this.dealerHand = [];
    this.dealerHiddenCard = 0;
    this.gameActive = false;
    this.playerStood = false;
  }

  async init() {
    const result = await this.alterPlayerTokens({
      username: this.username,
      amount: 0
    });

    this.playerTokens = result.newPoints;
  }

  drawCard() {
    return this.deck.drawCard();
  }

  idToSprite( cardID ) {
    return { 
      card_id: cardID % 13, 
      color_id: Math.floor(cardID / 13),
    }
  }
  idToPoints( id ) {
    let value = id % 13;
    return {
      temp: (value === 0 ? 10 : 0),
      value: Math.min( 10, value + 1 ),
    }
  }

  async startNewGame(betAmount) {
    const res = await this.alterPlayerTokens({ username: this.username, amount: -betAmount });
    if (res && res.success) this.playerTokens = res.newPoints;

    this.currentBet = betAmount;
    this.playerHand = [];
    this.playerPoints = 0;
    this.playerTempPoints = 0;
    this.dealerHand = [];
    this.dealerPoints = 0;
    this.dealerTempPoints = 0;
    this.dealerHiddenCard = 0;
    this.gameActive = true;
    this.playerStood = false;

    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
    this.playerHand.push(this.drawCard());
    this.dealerHiddenCard = this.drawCard();

    if ( this.playerPoints + this.playerTempPoints > 21 ) this.playerTempPoints -= 10;
  }

  getPlayerPoints() {
    let result = {
      value: 0,
      temp: 0,
    };

    this.playerHand.forEach((cardID) => {
      let v = this.idToPoints(cardID);

      result.value += v.value;
      result.temp += v.temp;
    });

    while ( result.value + result.temp > 21 && result.temp > 0 ) {
      result.temp -= 10;
    }

    return result.value + result.temp;
  }

  getDealerPoints() {
    let result = { value: 0, temp: 0, };

    this.dealerHand.forEach((cardID) => {
      let v = this.idToPoints(cardID);
      result.value += v.value; result.temp += v.temp;
    });

    let hiddenCardValue = this.idToPoints(this.dealerHiddenCard);
    result.value += hiddenCardValue.value;
    result.temp += hiddenCardValue.temp;
    
    while ( result.value + result.temp > 21 && result.temp > 0 ) {
      result.temp -= 10;
    }

    return result.value + result.temp;
  }

  playerHit( cardID ) {
    if (this.gameActive && !this.playerStood) {
      this.playerHand.push(cardID);
    }

    if ( this.getPlayerPoints() > 21 ) {
      this.playerStood = true;
    }
  }

  playerStand() {
    if (this.gameActive) {
      this.playerStood = true;
    }
  }

  dealerPlayTurn() {
    const newCards = [];
    if (!this.isPlayerBust())
      while (this.getDealerPoints() < 17) {
        const card = this.deck.drawCard();
        this.dealerHand.push(card);
        newCards.push(this.idToSprite(card));
      }
    return newCards;
  }

  isPlayerBust() {
    return this.getPlayerPoints() > 21;
  }

  isDealerBust() {
    return this.getDealerPoints() > 21;
  }

  async determineWinner() {
    const playerScore = this.getPlayerPoints();
    const dealerScore = this.getDealerPoints();

    if (playerScore > 21) {
      return { winner: 'DEALER', message: 'Player bust! Dealer wins.', payout: 0 };
    }

    if (dealerScore > 21) {
      const payout = this.currentBet * 2;
      await this.alterPlayerTokens({ username: this.username, amount: payout });
      this.playerTokens += payout;
      return { winner: 'PLAYER', message: 'Dealer bust! You win!', payout };
    }

    if (playerScore > dealerScore) {
      const payout = this.currentBet * 2;
      await this.alterPlayerTokens({ username: this.username, amount: payout });
      this.playerTokens += payout;
      return { winner: 'PLAYER', message: 'You win!', payout };
    }

    if (dealerScore > playerScore) {
      return { winner: 'DEALER', message: 'Dealer wins!', payout: 0 };
    }

    const payout = this.currentBet;
    await this.alterPlayerTokens({ username: this.username, amount: payout });
    this.playerTokens += payout;
    return { winner: 'PUSH', message: 'Push! It\'s a tie.', payout };
  }

  endGame() {
    this.gameActive = false;
  }

  async handleAction(data, ws) {
    const { action, betAmount } = data;

    try {
      if (action !== 'HIT' && action !== 'STAND' && !this.gameActive) {
        // Allow initial bet
      }

      let response;
      if (debug_print) console.log(action); // DEBUG
      switch (action) {
        case 'NEW_GAME': {
          const wager = Number(betAmount);

          if (!Number.isFinite(wager) || wager <= 0) {
            response = { action: 'ERROR', message: 'Invalid bet amount' };
            break;
          }

          if (wager > this.playerTokens) {
            response = { action: 'ERROR', message: 'Bet exceeds available currency' };
            break;
          }

          await this.startNewGame(wager);

          response = {
            action: 'START',
            playerCards: this.playerHand.map((cardID) => this.idToSprite(cardID)),
            dealerCard: this.idToSprite(this.dealerHand[0]),
            playerScore: this.getPlayerPoints(),
            dealerScore: this.idToPoints(this.dealerHand[0]).value + this.idToPoints(this.dealerHand[0]).temp,
            currentBet: this.currentBet,
            currency: this.playerTokens,
            playerTempScore: 0,
            dealerTempScore: 0,
          };
          break;
        }

        case 'HIT': {
          if (!this.gameActive) {
            response = { action: 'ERROR', message: 'No active game' };
            break;
          }

          let drawnCard = this.drawCard();
          this.playerHit(drawnCard);

          response = {
            action: 'HIT',
            card: this.idToSprite(drawnCard),
            playerScore: this.getPlayerPoints(),
            dealerScore: this.idToPoints(this.dealerHand[0]).value + this.idToPoints(this.dealerHand[0]).temp,
            dealerTempScore: 0,
            playerTempScore: 0,
            playerBust: this.isPlayerBust(),
          };

          break;
        }

        case 'STAND': {
          if (!this.gameActive) {
            response = { action: 'ERROR', message: 'No active game' };
            break;
          }

          this.playerStand();
          response = { action: 'WILLING-STAND' };
          break;
        }

        default:
          response = { action: 'ERROR', message: 'Unknown action' };
      }

      if (debug_print) console.log(response); // DEBUG

      if ( response.action !== 'WILLING-STAND' ) {
        ws.send(JSON.stringify(response));
      }

      if ( this.playerStood && this.gameActive ) {
        const newCards = this.dealerPlayTurn();
        const result = await this.determineWinner();

        response = {
          action: 'DEALER-TURN',
          revealedDealerCard: this.idToSprite(this.dealerHiddenCard),
          newCards,
          dealerScore: this.getDealerPoints(),
          statusMessage: result.message,
          gameEnded: true,
          payout: result.payout,
          newTotal: this.playerTokens,
        };

        if (debug_print) console.log(response); // DEBUG
        ws.send(JSON.stringify(response));
        this.endGame();
      }
    } catch (error) {
      console.error('Error handling action:', error);
      ws.send(JSON.stringify({ action: 'ERROR', message: 'Server error' }));
    }
  }
}

module.exports = GameSession;