import { motion, sync } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import '../styles/Blackjack.css';
import Hand from '../components/blackjack/Hand';
import Card from '../components/blackjack/Card';

//import ConfettiCanvas from './components/ConfettiCanvas';

import { confettiCannons, fireworkCannons } from '../assets/confettiCannons';

const DEFAULT_BET = 50;
const DEFAULT_URL = 'ws://127.0.0.1:6583/game/blackjack-game'

const emptyGameState = {
  playerScore: 0,
  playerTempScore: 0,
  dealerScore: 0,
  dealerTempScore: 0,
  gameActive: false,
  playerStood: false,
  currentBet: 0,
};

function Blackjack({ user, syncPoints }) {
  const updatePoints = x => { syncPoints(x); }
  const confettiWin = confettiCannons; 
  const fireworkWin = fireworkCannons; 

  const standDelay = useRef(true); // replacement na gameSession.playerStood bo sie psuje, moze byc wina po stronie mojego pc

  const animateStages = useRef([]);
  const socketRef = useRef(null);

  const [connectionState, setConnectionState] = useState('connecting');
  const [sessionId, setSessionId] = useState('');
  const [currency, setCurrency] = useState( user.points );
  const [betAmount, setBetAmount] = useState(DEFAULT_BET);
  const [gameState, setGameState] = useState(emptyGameState);
  const [statusMessage, setStatusMessage] = useState('Connecting to the server...');
  const [errorMessage, setErrorMessage] = useState('');

  const [cardPile, setCardPile] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(false);
  const [clickReset, setClickReset] = useState(false);

  const resetToBet = () => {
    if (!clickReset) return;

    animateStages.current.forEach((id) => clearTimeout(id));
    animateStages.current = [];

    setGameState(emptyGameState);
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerTurn(false);
    setClickReset(false);
    setCardPile([]);
  };

  const startGame = () => {
    const numericBet = Number(betAmount);

    if (!Number.isFinite(numericBet) || numericBet <= 0 || numericBet > currency) {
      setErrorMessage('Incorrect amount');
      return;
    }
    setErrorMessage('');

    serverAction({ action: 'NEW_GAME', betAmount: numericBet });
    setStatusMessage('Choose action');
  };

  const gameActive = Boolean(gameState.gameActive);
  const betLocked = gameState.currentBet > 0 && !gameActive;
  const getVisibleScore = (score, tempScore) => {
    if (tempScore > 0 && score > 21) {
      return tempScore;
    }

    return score;
  };
  
  useEffect(() => {
    const socket = new WebSocket(DEFAULT_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionState('connected');
      setStatusMessage('Place bet');
      setErrorMessage('');

      serverAction({ msg: 'PLAYER-INIT', username: user.username });
    };

    socket.onerror = () => {
      setConnectionState('error');
      setStatusMessage('Connection failed');
    };

    socket.onclose = () => {
      setConnectionState('disconnected');
      setStatusMessage('Connection closed, refresh to reconnect');
    };

    socket.onmessage = (event) => {
      let payload;

      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        setErrorMessage('Received an invalid server message.');
        return;
      }

      console.log(payload); // DEBUG

      switch( payload.action ) {
        case 'INIT': {
          setSessionId(payload.sessionId);
          //setCurrency(payload.currency); not here rn

          setStatusMessage('Place bet');
          setErrorMessage('');
          break;
        }
        case 'START': {
          setCardPile([]);
          setPlayerCards([]);
          setDealerCards([]);

          standDelay.current = true;

          setCurrency(payload.currency);
          setBetAmount(payload.currentBet);
          syncPoints(payload.currency);

          const d = 300;

          setGameState(prev => ({ 
            ...prev, 
            playerScore: payload.playerScore, 
            playerTempScore: payload.playerTempScore,
            dealerScore: payload.dealerScore,
            dealerTempScore: payload.dealerTempScore,
            gameActive: true,
            playerStood: false,
          }));

          animateStages.current.push(
            // player card 1
            setTimeout(() => setPlayerCards(prev => 
              [ ...prev, 
                { color_id: payload.playerCards[0].color_id, card_id: payload.playerCards[0].card_id, flipped: false, }
              ]
            ), 0),

            // dealer card 1
            setTimeout(() => setDealerCards(prev => 
              [ ...prev, 
                { flipped: true, }
              ]
            ), d),

            // player card 2
            setTimeout(() => setPlayerCards(prev => 
              [ ...prev, 
                { color_id: payload.playerCards[1].color_id, card_id: payload.playerCards[1].card_id, flipped: false, }
              ]
            ), d * 2),

            // dealer card 2
            setTimeout(() => setDealerCards(prev => 
              [ ...prev,
                { color_id: payload.dealerCard.color_id, card_id: payload.dealerCard.card_id, flipped: false, }
              ]
            ), d * 3),

            setTimeout(() => setPlayerTurn(true), d * 3),
          );

          break;
        }
        case 'HIT': {
          const newCard = {
            card_id: payload.card.card_id,
            color_id: payload.card.color_id,
            flipped: true,
          };

          setCardPile([newCard]);

          animateStages.current.push(
            // flip card
            setTimeout(() => {
              setCardPile(prev => 
                prev.map((c, i) => 
                  i === prev.length - 1 ? { ...c, flipped: false } : c
                )
              );
            }, 100),

            // move to hand, update player points, end playerTurn if bust
            setTimeout(() => {
              setPlayerCards(prev => [...prev, { ...newCard, flipped: false }]);
              setCardPile([]);

              setGameState(prev => ({
                ...prev,
                playerScore: payload.playerScore ?? prev.playerScore,
                playerTempScore: payload.playerTempScore ?? prev.playerTempScore,
                dealerScore: payload.dealerScore ?? prev.dealerScore,
                dealerTempScore: payload.dealerTempScore ?? prev.dealerTempScore,
              }));

              if (payload.gameEnded) {
                setPlayerTurn(false);
                if (payload.statusMessage) {
                  setStatusMessage(payload.statusMessage);
                }
                setClickReset(true);
              }
            }, 1000),
          );

          break;
        }
        case 'DEALER-TURN': {
          const d = 1000;

          const revealed = payload.revealedDealerCard;
          const extra = payload.newCards;

          const runDealerTurn = () => {
            // hidden card
            setDealerCards(prev => {
              const hid = prev.findIndex(c => c.flipped === true);
              if (hid === -1) return prev;
              return prev.map((c, i) => i === hid ? { ...c, card_id: revealed.card_id, color_id: revealed.color_id } : c);
            });

            animateStages.current.push(setTimeout(() => {
              setDealerCards(prev => prev.map(c => c.flipped ? { ...c, flipped: false } : c));
            }, 20));

            extra.forEach((card, idx) => {
              const start = (idx+1) * d;

              // spawn
              animateStages.current.push(setTimeout(() => {
                setCardPile([{ card_id: card.card_id, color_id: card.color_id, flipped: true }]);
              }, start));

              // flip
              animateStages.current.push(setTimeout(() => {
                setCardPile(prev => prev.map((c, i) => i === prev.length - 1 ? { ...c, flipped: false } : c));
              }, start + 20));

              // 'move'
              animateStages.current.push(setTimeout(() => {
                setDealerCards(prev => [...prev, { card_id: card.card_id, color_id: card.color_id, flipped: false }]);
                setCardPile([]);
              }, start + 750));
            });

            animateStages.current.push(setTimeout(() => {
              const finalMsg = payload.statusMessage || payload.message || '';
              if (finalMsg) setStatusMessage(finalMsg);
              if ( payload.payout > betAmount ) confettiWin();
              setClickReset(true);
              setGameState(prev => ({
                ...prev,
                dealerScore: payload.dealerScore,
              }))
              setCurrency(prev => (prev + payload.payout));
              syncPoints(payload.newTotal);
            }, (extra.length) * d + 0.5));
          };

          if (standDelay.current) {
            animateStages.current.push(setTimeout(runDealerTurn, 1000));
          } else {
            runDealerTurn();
          }

          break;
        }
        case 'ERROR': 
        default: {
          setStatusMessage('Something went wrong.');
        }
      }
    };


    return () => {
      animateStages.current.forEach((id) => clearTimeout(id));
      animateStages.current = [];

      socket.close();
    };
  }, []);

  const serverAction = (payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setErrorMessage('connection failed');
      return;
    };

    socketRef.current.send(JSON.stringify(payload));
  };

  const action_hit = () => {
    if ( gameState.playerStood ) return;
    serverAction({ action: 'HIT' });
  }

  const action_stand = () => {
    if ( gameState.playerStood ) return;
    setGameState(prev => {
      standDelay.current = false;
      console.log(prev);
      let x = {
        ...prev,
        playerStood: true,
      };
      return x;
    });
    serverAction({ action: 'STAND' });
  }

  return (
    <main className="table-shell">
      <div className="table"
        onClick={resetToBet} role="button" tabIndex={0} aria-disabled={!clickReset}
      >

        <section className="dealer-area">
          {gameState.gameActive ? (
            <div className="hand-score hand-score--dealer">Dealer: {getVisibleScore(gameState.dealerScore, gameState.dealerTempScore)}</div>
          ) : null}
          <div className="hand-label"></div>
          <Hand cards={dealerCards} flip={true}/> 
        </section>

        <aside className="action-panel action-panel--left">
          <button
            type="button"
            className="pile-button"
            onClick={action_hit}
            disabled={!playerTurn}
            aria-label="Draw a card"
          >
            <Card card_id={0} color_id={0} size={150} flipped={true} className="pile-button__card" />
          </button>
          {cardPile.length > 0 ? (
            <motion.div
              className="card-pile-stage"
              initial={{scale:1}}
              animate={{scale:1.35}}
              transition={{type: "spring", stiffness: 300, damping: 15}}
              aria-hidden="true"
            >
              {cardPile.map((card, index) => (
                <Card
                  key={`pile-${index}-${card.card_id}-${card.color_id}`}
                  card_id={card.card_id}
                  color_id={card.color_id}
                  size={150}
                  flipped={card.flipped}
                  className="card-pile-stage__card"
                  rotation={0}
                  style={{ zIndex: index + 1 }}
                />
              ))}
            </motion.div>
          ) : null}
        </aside>

        <aside className="action-panel action-panel--right">
          <button type="button" className="action-button action-button--stand" onClick={action_stand} disabled={!playerTurn}>
            Stand
          </button>
        </aside>

        <section className="center-panel" aria-live="polite">
          {gameState.gameActive ? (
            <>
              <div className="center-panel__bet">Bet: {betAmount}</div>
            </>
          ) : (
            <>
              <label className="bet-field">
                <span className="bet-field__label">Bet amount</span>
                <input
                  className="bet-field__input"
                  type="number"
                  min="1"
                  max={user.points}
                  value={betAmount}
                  onChange={(event) => setBetAmount(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="start-button"
                onClick={startGame}
                disabled={connectionState !== 'connected' || Number(betAmount) > currency}
              >
                Start Game
              </button>
            </>
          )}

          {errorMessage ? <div className="center-panel__error">{errorMessage}</div> : null}
          <div className={`center-panel__status${betLocked ? ' center-panel__row--result' : ''}`}>
            {statusMessage}
          </div>
        </section>

        <section className="player-area">
          <div className="hand-label"></div>
          <Hand cards={playerCards} />
          {gameState.gameActive ? (
            <div className="hand-score hand-score--player">Player: {getVisibleScore(gameState.playerScore, gameState.playerTempScore)}</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default Blackjack;
