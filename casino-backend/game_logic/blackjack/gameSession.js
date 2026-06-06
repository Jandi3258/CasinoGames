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
    this.handID = 1;
    this.queuedHands = [];
    this.resolvedHands = [];
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

  async cashOut(payout) {
    this.playerTokens += payout;
    await this.alterPlayerTokens({ username: this.username, amount: payout });
  }

  async bet(amount) {
    this.currentBet = amount;
    this.playerTokens -= amount;
    await this.alterPlayerTokens({ username: this.username, amount: -amount });
    return amount;
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

  handToPoints( cards ) {
    let total = 0;
    let aces = 0;
    cards.forEach(card => {
        let val = this.idToPoints(card);
        total += val.value;
        aces += (val.temp / 10);
    });

    while ( aces > 0 ) {
        if ( total <= 11 ) {
            total += 10;
            aces -= 1;
        } else break;
    }
    return total;
  }

  async startNewGame(betAmount) {
    const res = await this.alterPlayerTokens({ username: this.username, amount: -betAmount });
    if (res && res.success) this.playerTokens = res.newPoints;

    this.currentBet = betAmount;
    this.handID = 1;
    this.playerHand = [];
    this.queuedHands = [];
    this.resolvedHands = [];
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
      while ( this.getDealerPoints() < 17 ) {
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

  async evaluateBlackjack() { 
    if ( this.getPlayerPoints() < 21 ) return null;
    
    let result = {};
    result['revealedDealerCard'] = this.idToSprite(this.dealerHiddenCard);
    result['dealerScore'] = this.getDealerPoints();

    if ( result.dealerScore < 21 ) {
      result['payout'] = Math.floor( this.currentBet * (3/2) );
      result['statusMessage'] = "Blackjack! Wygrywasz!";
    }
    else {
      result['payout'] = this.currentBet;
      result['statusMessage'] = "Remis!";
    }
    this.cashOut(result['payout']);
    result['newTotal'] = this.playerTokens;
    return result;
  }

  async determineWinner() {
    const playerScore = this.getPlayerPoints();
    const dealerScore = this.getDealerPoints();

    if (playerScore > 21) {
      return { winner: 'DEALER', message: 'Przebiłeś! Krupier wygrywa.', payout: 0 };
    }

    if (dealerScore > 21) {
      const payout = this.currentBet * 2;
      this.cashOut(payout);
      return { winner: 'PLAYER', message: 'Krupier przebił! Wygrywasz!', payout };
    }

    if (playerScore > dealerScore) {
      const payout = this.currentBet * 2;
      this.cashOut(payout);
      return { winner: 'PLAYER', message: 'Wygrywasz!', payout };
    }

    if (dealerScore > playerScore) {
      return { winner: 'DEALER', message: 'Krupier wygrywa!', payout: 0 };
    }

    const payout = this.currentBet;
    this.cashOut(payout);
    return { winner: 'PUSH', message: 'Remis.', payout };
  }

  getResult(hand_id, hand_bet, hand_cards) {
    const playerScore = this.handToPoints(hand_cards);
    const dealerScore = this.getDealerPoints();
    let payout = hand_bet;
    let message = 'Remis';
    console.log('P: ', playerScore, ', D: ', dealerScore);
    if (playerScore > 21) {
      message = 'Przebiłeś! Krupier wygrywa.';
      payout = 0;
    }
    else
    if (dealerScore > 21) {
      message = 'Krupier przebił! Wygrywasz!';
      payout = hand_bet * 2;
    }
    else
    if (playerScore > dealerScore) {
      message = 'Wygrywasz!';
      payout = hand_bet * 2;
    }
    else
    if (dealerScore > playerScore) {
      message = 'Krupier wygrywa!'; 
      payout = 0;
    }
    
    return {h_handID: hand_id, h_payout: payout, h_statusMessage: message};
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
            response = { action: 'ERROR', message: 'Niepoprawna ilość zakładu.' };
            break;
          }

          if (wager > this.playerTokens) {
            response = { action: 'ERROR', message: 'Brak żetonów.' };
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
            blackjack: await this.evaluateBlackjack(), // revealedDealerCard, dealerScore, payout, statusMessage, newTotal
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

        case 'SPLIT': {
          if (!this.gameActive) {
            response = { action: 'ERROR', message: 'No active game' };
            break;
          }

          if (this.alterPlayerTokens({username: this.username, amount: 0}) < this.currentBet) {
            response = { action: 'ERROR', message: 'Brak żetonów na tą akcję' };
            break;
          }
          this.playerTokens -= this.currentBet;
          this.alterPlayerTokens({username: this.username, amount: -this.currentBet});

          this.queuedHands.push({
            id: this.handID + this.queuedHands.length + 1,
            bet: this.currentBet,
            cards: [this.playerHand.pop()],
          });

          let drawnCard = this.drawCard();
          this.playerHit(drawnCard);

          response = {
            action: 'SPLIT',
            currency: this.playerTokens,
            currentBet: this.currentBet,
            card: this.idToSprite(drawnCard),
          }
          break;
        }
        
        case 'DOUBLE-DOWN': {
          if (!this.gameActive) {
            response = { action: 'ERROR', message: 'No active game' };
            break;
          }

          if (this.alterPlayerTokens({username: this.username, amount: 0}) < this.currentBet) {
            response = { action: 'ERROR', message: 'Brak żetonów na tą akcję' };
            break;
          }
          this.playerTokens -= this.currentBet;
          this.alterPlayerTokens({username: this.username, amount: -this.currentBet});
          this.currentBet = this.currentBet * 2;
          
          let drawnCard = this.drawCard();
          this.playerHit(drawnCard);
          this.playerStood = true;

          response = {
            action: 'DOUBLE-DOWN',
            card: this.idToSprite(drawnCard),
            playerScore: this.getPlayerPoints(),
            dealerScore: this.idToPoints(this.dealerHand[0]).value + this.idToPoints(this.dealerHand[0]).temp,
            dealerTempScore: 0,
            playerTempScore: 0,
            playerBust: this.isPlayerBust(),
            playerStood: this.playerStood,
            betAmount: this.currentBet,
            currency: this.playerTokens,
          }

          break;
        }

        case 'SURRENDER': {
          if ( this.resolvedHands.length > 0 || this.queuedHands.length > 0 || this.playerHand.length > 2 ) {
            response = { action: 'ERROR', message: 'Can\'t surrender' }; 
          }
          else {
            let recoveredTokens = Math.floor(this.currentBet / 2);
            this.cashOut(recoveredTokens);
            response = {
              action: 'SURRENDER',
              revealedDealerCard: this.idToSprite(this.dealerHiddenCard),
              payout: recoveredTokens,
              newTotal: this.playerTokens,
            }
            this.endGame();
          }
          break;
        }

        default:
          response = { action: 'ERROR', message: 'Unknown action' };
      }

      if (debug_print) console.log(response); // DEBUG

      if ( response.action !== 'WILLING-STAND' ) {
        ws.send(JSON.stringify(response));
      }

      if ( response.blackjack ) {
        this.endGame();
      } else
      if ( this.playerStood && this.gameActive && response.action !== 'SURRENDER' ) {
        if ( this.queuedHands.length > 0 ) {
          this.playerStood = false;

          let drawnCard = this.drawCard();
          this.resolvedHands.push({
            id: this.handID,
            bet: this.currentBet,
            cards: this.playerHand,
          });

          let nextHand = this.queuedHands.find(hand => hand.id === (this.handID + 1));
          [this.handID, this.currentBet, this.playerHand] = [nextHand.id, nextHand.bet, nextHand.cards];
          this.queuedHands = this.queuedHands.filter(hand => hand.id !== this.handID);

          this.playerHit(drawnCard);

          response = {
            action: 'NEXT-HAND',
            card: this.idToSprite(drawnCard),
          };
          if (debug_print) console.log(response); // DEBUG
          ws.send(JSON.stringify(response));
        } 
        else {
          this.resolvedHands.push({
            id: this.handID,
            bet: this.currentBet,
            cards: this.playerHand,
          });
          const newCards = this.dealerPlayTurn();
          let totalWin = 0; 
          if (debug_print) console.log(this.handID, this.currentBet, this.playerHand); // DEBUG
          let result = [];

          this.resolvedHands.forEach(({id, bet, cards}) => {
            console.log("running for: ", id, bet, cards);
            let h_res = this.getResult(id, bet, cards);
            totalWin += h_res.h_payout;
            result.push(h_res);
          });

          console.log("Total Winning is: ", totalWin);
          await this.cashOut(totalWin);

          response = {
            action: 'DEALER-TURN',
            revealedDealerCard: this.idToSprite(this.dealerHiddenCard),
            newCards,
            dealerScore: this.getDealerPoints(),
            statusMessage: result.message,
            gameEnded: true,
            payout: result.payout,
            newTotal: this.playerTokens,
            results: result,
          };
          if (debug_print) console.log(response); // DEBUG
          ws.send(JSON.stringify(response));
          this.endGame();
        }
      }
    } catch (error) {
      console.error('Error handling action:', error);
      ws.send(JSON.stringify({ action: 'ERROR', message: 'Server error' }));
    }
  }
}

module.exports = GameSession;