import { LayoutGroup, motion, sync } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import '../styles/Blackjack.css';
import Hand from '../components/blackjack/Hand';
import Card from '../components/blackjack/Card';
import * as Util from '../components/blackjack/Utility';
import { sleep } from '../components/blackjack/Utility';

import { confettiCannons, fireworkCannons } from '../assets/confettiCannons';

const DEFAULT_BET = 50;
const DEFAULT_URL = 'ws://127.0.0.1:8080/game/blackjack-game'

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
  const lastAction = useRef('');

  const animateStages = useRef([]);
  function withDelay(ms, func) {
    const id = setTimeout(func, ms);
    animateStages.current.push(id);
    return id;
  };

  const socketRef = useRef(null);

  const [connectionState, setConnectionState] = useState('connecting');
  const [sessionId, setSessionId] = useState('');
  const [currency, setCurrency] = useState(user.points);
  const [betDisplay, setBetDisplay] = useState(DEFAULT_BET);
  const betAmount = useRef(DEFAULT_BET);
  function setBetAmount(val) {
    setBetDisplay(val);
    betAmount.current = val;
  }
  const [gameState, setGameState] = useState(emptyGameState);
  const [statusMessage, setStatusMessage] = useState('Łączenie z serwerem...');
  const [errorMessage, setErrorMessage] = useState('');

  const [cardPile, setCardPile] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(false);
  const playerTurnRef = useRef(playerTurn); useEffect(() => { playerTurnRef.current = playerTurn; }, [playerTurn]);
  const gameEndedRef = useRef(true);
  const [clickReset, setClickReset] = useState(false); const betsComplete = useRef(false);

  const [canSplit, setCanSplit] = useState(false);
  const [canDoubleDown, setCanDoubleDown] = useState(false);

  const [playerHands, setPlayerHands] = useState([]);

  const activeHand = playerHands.find(hand => hand.status === 'active') ?? null;
  const playerCards = activeHand?.cards ?? [];
  const inactiveHands = playerHands.filter(hand => hand.status !== 'active');
  const canSurrender = lastAction.current === 'NEW_GAME' && playerTurn;

  // ref hooks because react is killing me
  const activeHandRef = useRef(null);
  const playerHandsRef = useRef(null);

  function addPlayerCard(card) {
    const newCard = { 
      uid: card.uid ?? Util.newID(), 
      color_id: card.color_id ?? 0, 
      card_id: card.card_id ?? 0, 
      flipped: card.flipped ?? !(card.color_id != null && card.card_id != null)
    }
    setPlayerHands(prev => prev.map(hand => 
        hand.status === 'active'
        ? {
          ...hand,
          cards: [
            ...hand.cards, 
            newCard
          ]
        }
        : hand
      )
    )
  }

  useEffect(() => {
    playerHandsRef.current = playerHands;
    activeHandRef.current = playerHands.find(h => h.status === 'active') ?? null;

    setCanSplit(checkCanSplit());
  }, [playerHands]);

  const [messageUpdater, setMessageUpdater] = useState(0);
  useEffect(() => {
    setMessageUpdater(prev => (prev + 1));
  }, [statusMessage]);

  function playerDrawAnimation(card) {
    const uid = Util.newID();
    const newCard = {
      uid,
      card_id: card.card_id,
      color_id: card.color_id,
      flipped: true,
    };
    const handCard = {
      ...newCard,
      flipped: false,
    };

    setCardPile([newCard]);

    // flip card
    withDelay(100, () => {
      setCardPile(prev =>
        prev.map((c, i) => (i === prev.length - 1 ? { ...c, flipped: false } : c))
      );
    });

    // move to hand, update player points, end playerTurn if bust
    withDelay(1000, () => {
      addPlayerCard(handCard);
      setCardPile([]);
    });
  }

  function addDealerCard(card) {
    setDealerCards(prev => [
      ...prev,
      { uid: card.uid ?? Util.newID(), 
        color_id: card.color_id ?? 0, 
        card_id: card.card_id ?? 0, 
        flipped: card.flipped ?? !(card.color_id != null && card.hand_id != null)
      }
    ])
  }

  function initHand(bet = betAmount.current) {
    setPlayerHands([
      { id: 'hand-1', cards: [], bet, status: 'active' }
    ]);
  }

  function checkCanSplit() {
    if ( currency < betAmount.current ) return;
    //const activeCards = playerHands.find(hand => hand.status === 'active').cards;
    if ( playerCards.length === 2 && (Util.cardToPoints(playerCards[0]).full === Util.cardToPoints(playerCards[1]).full) ) return true;
    return false;
  }
  function checkCanDoubleDown() {
    if ( currency < betAmount.current ) return false;
    return ( playerCards.length === 2 );
  }

  function splitHands() {
    setPlayerHands(prev => {
      const activeIndex = prev.findIndex(hand => hand.status === 'active');
      if (activeIndex === -1) return prev;

      const activeHand = prev[activeIndex];
      if (activeHand.cards.length !== 2) return prev;
      
      const [firstCard, secondCard] = activeHand.cards;
      const splitBet = activeHand.bet;

      const nextHands = prev.map((hand, index) => (
        index === activeIndex
          ? { ...hand, cards: [firstCard] }
          : hand
      ));

      nextHands.push({
        id: `hand-${prev.length + 1}`,
        cards: [secondCard],
        bet: splitBet,
        status: 'queued',
      });

      return nextHands;
    });

    return true;
  }

  function nextHand() {
    setPlayerHands(prev => {
      const activeIndex = prev.findIndex(h => h.status === 'active');
      if (activeIndex === -1) return prev;

      const next = activeIndex + 1; // index-based, no string parsing needed

      if (next >= prev.length) {
        betsComplete.current = true;
        return prev.map((h, i) =>
          i === activeIndex ? {...h, status: 'played'} : h
        );
      }

      return prev.map((h, i) => {
        if (i === activeIndex) return {...h, status: 'played'};
        if (i === next) return {...h, status: 'active'};
        return h;
      });
    });
  }

  function doubleBet(payload) {
    if (payload?.currency != null) {
      setCurrency(payload.currency);
      updatePoints(payload.currency);
    }

    if (payload?.currentBet != null) {
      setBetAmount(payload.currentBet);
    }
    
    setPlayerHands(prev => 
      prev.map(hand => {
        let stake = hand.bet;
        return hand.status === 'active'
        ? {...hand, bet: (stake * 2)}
        : hand
      })
    );
  }

  function resetToBet() {
    if (!clickReset) return;

    animateStages.current.forEach((id) => clearTimeout(id));
    animateStages.current = [];

    setGameState(emptyGameState);
    setPlayerHands([]);
    setDealerCards([]);
    setPlayerTurn(false);
    setClickReset(false);
    setCardPile([]);
  };

  function startGame() {
    const numericBet = Number(betAmount.current);

    if (!Number.isFinite(numericBet) || numericBet <= 0 || numericBet > currency) {
      setErrorMessage('Incorrect amount');
      return;
    }
    setErrorMessage('');

    serverAction({ action: 'NEW_GAME', betAmount: numericBet });
    setStatusMessage('Twoja tura.');
  };

  const gameActive = Boolean(gameState.gameActive);
  const betLocked = gameState.currentBet > 0 && !gameActive;
  function getVisibleScore(score, tempScore) {
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
      setStatusMessage('Połączenie nieudane.');
    };

    socket.onclose = () => {
      setConnectionState('disconnected');
      setStatusMessage('Połączenie zamknięte, odśwież aby połączyć jeszcze raz.');
    };

    socket.onmessage = async (event) => { // make async for the await sleep() bc yes
      let payload;

      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        setErrorMessage('Błąd przetwarzania informacji z serwera.');
        return;
      }

      switch (payload.action) {
        case 'INIT': {
          setSessionId(payload.sessionId);
          //setCurrency(payload.currency); not here rn

          setStatusMessage('Postaw zakład');
          setErrorMessage('');
          break;
        }
        case 'START': {
          setCardPile([]);
          setDealerCards([]);
          gameEndedRef.current = false;

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

          initHand();

          // schedule initial deal with withDelay helper
          withDelay(0, () => addPlayerCard(
            { color_id: payload.playerCards[0].color_id, card_id: payload.playerCards[0].card_id }
          ));

          withDelay(d, () => addDealerCard(
            { uid: Util.newID(), flipped: true }
          ));

          withDelay(d * 2, () => addPlayerCard(
            { color_id: payload.playerCards[1].color_id, card_id: payload.playerCards[1].card_id }
          ));

          withDelay(d * 3, () => addDealerCard(
            { uid: Util.newID(), color_id: payload.dealerCard.color_id, card_id: payload.dealerCard.card_id, flipped: false }
          ));

          withDelay(d * 3, () => {
            if (!payload.blackjack) {
              setPlayerTurn(true);
              setCanDoubleDown(currency >= betAmount.current);
              return;
            }

            lastAction.current = 'NEW_GAME_BLACKJACK'; // dla canSurrender

            const blackjackResult = payload.blackjack;

            setStatusMessage("BLACKJACK!"); fireworkWin();
            const revealed = blackjackResult.revealedDealerCard;

            withDelay(1500, () => {
              setDealerCards(prev => {
                const hid = prev.findIndex(c => c.flipped === true);
                if (hid === -1) return prev;
                return prev.map((c, i) => i === hid ? { ...c, card_id: revealed.card_id, color_id: revealed.color_id } : c);
              });
            });

            // hidden card flip
            withDelay(1520, () => {
              setDealerCards(prev => prev.map(c => (c.flipped ? { ...c, flipped: false } : c)));

              setStatusMessage(blackjackResult.statusMessage);

              if (blackjackResult.payout > betAmount.current) confettiWin();
              setClickReset(true);
              setGameState(prev => ({
                ...prev,
                dealerScore: blackjackResult.dealerScore,
              }));
              setCurrency(prev => (prev + blackjackResult.payout));
              updatePoints(blackjackResult.newTotal);

            });

          });

          break;
        }
        case 'SURRENDER': {
          const revealed = payload.revealedDealerCard;

          setStatusMessage('Poddajesz się! Odzyszkujesz ' + payload.payout);
          setCanDoubleDown(false);
          setCanSplit(false);
          // hidden card set face
          setDealerCards(prev => {
            const hid = prev.findIndex(c => c.flipped === true);
            if (hid === -1) return prev;
            return prev.map((c, i) => i === hid ? { ...c, card_id: revealed.card_id, color_id: revealed.color_id } : c);
          });

          // hidden card flip
          withDelay(20, () => {
            setDealerCards(prev => prev.map(c => (c.flipped ? { ...c, flipped: false } : c)));
          });

          setCurrency(prev => (prev + payload.payout));
          updatePoints(payload.newTotal);

          setPlayerTurn(false);
          setClickReset(true);
          break;
        }
        case 'DOUBLE-DOWN': {
          setCanDoubleDown(false);
          
          doubleBet(payload);
          
          playerDrawAnimation(payload.card);
          
          setPlayerTurn(false);
          break;
        }
        case 'HIT': {
          setCanDoubleDown(false);
          playerDrawAnimation(payload.card);

          withDelay(1000, () => {
            setGameState(prev => ({ // TODO might be good to change this whole thing
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
            }
          });

          break;
        }
        case 'SPLIT': {
          setCurrency(payload.currency);
          setBetAmount(payload.currentBet);
          updatePoints(payload.currency);
          
          splitHands();
          
          playerDrawAnimation(payload.card);
          
          await sleep(1000);
          setPlayerTurn(true);
          console.log('pturn: ', playerTurn, ' curr: ', currency, ' betAm ', betAmount);
          setCanDoubleDown(currency >= betAmount.current);
          break;
        }
        case 'NEXT-HAND': {
          // sent instead of DEALER-TURN if theres any hands that have not been played yet
          if (lastAction.current != 'STAND') {
            await sleep(1500);
          }
          nextHand();
          playerDrawAnimation(payload.card);
          setPlayerTurn(true);
          setCanDoubleDown(currency >= betAmount.current);
          setGameState(prev => ({...prev, playerStood: false}));
          break;
        }
        case 'DEALER-TURN': {
          setCanSplit(false);
          setCanDoubleDown(false);
          const d = 1000;

          const revealed = payload.revealedDealerCard;
          const extra = payload.newCards;

          if (lastAction.current != 'STAND') {
            await sleep(1000);
          }

          // hidden card set face
          setDealerCards(prev => {
            const hid = prev.findIndex(c => c.flipped === true);
            if (hid === -1) return prev;
            return prev.map((c, i) => i === hid ? { ...c, card_id: revealed.card_id, color_id: revealed.color_id } : c);
          });

          // hidden card flip
          withDelay(20, () => {
            setDealerCards(prev => prev.map(c => (c.flipped ? { ...c, flipped: false } : c)));
          });

          extra.forEach((card, idx) => {
            const start = (idx + 1) * d;

            const nextCard = { uid: Util.newID(), card_id: card.card_id, color_id: card.color_id, flipped: true }

            // spawn
            withDelay(start, () => {
              setCardPile([nextCard]);
            });

            // flip
            withDelay(start + 20, () => {
              setCardPile(prev => prev.map((c, i) => (i === prev.length - 1 ? { ...c, flipped: false } : c)));
            });

            // 'move'
            withDelay(start + 750, () => {
              addDealerCard({...nextCard, flipped: false});
              setCardPile([]);
            });
          });

          withDelay((extra.length) * d + 0.5, async () => {
            setGameState(prev => ({
              ...prev,
              dealerScore: payload.dealerScore,
            }));

            const handsToEvaluate = [...payload.results];

            let skipLastDelay = 0;
            for (const { h_handID, h_payout, h_statusMessage } of handsToEvaluate) {
            // show this hand as active
              setPlayerHands(prev =>
                prev.map(hand =>
                  hand.id === `hand-${h_handID}`
                    ? { ...hand, status: 'active' }
                    : { ...hand, status: hand.status === 'active' ? 'played' : hand.status }
                )
              );

              await sleep(500);
              setStatusMessage(h_statusMessage);
              if (h_payout > betAmount.current) confettiWin();
              setCurrency(prev => prev + h_payout);
              if ( ++skipLastDelay < handsToEvaluate.length )
                await sleep(1600);
            }

            // all hands evaluated
            updatePoints(payload.newTotal);
            setClickReset(true);
          });

          break;
        }
        case 'ERROR':
        default: {
          setStatusMessage('Coś poszło nie tak.');
        }
      }
    };


    return () => {
      animateStages.current.forEach((id) => clearTimeout(id));
      animateStages.current = [];

      socket.close();
    };
  }, []);

  function serverAction(payload) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setErrorMessage('Połączenie nieudane');
      return;
    };

    lastAction.current = payload.action ?? '';
    socketRef.current.send(JSON.stringify(payload));
  };

  function action_hit() {
    if (gameState.playerStood) return;
    serverAction({ action: 'HIT' });
  }

  function action_stand() {
    if (gameState.playerStood) return;
    setGameState(prev => {
      standDelay.current = false;
      let x = {
        ...prev,
        playerStood: true,
      };
      return x;
    });
    serverAction({ action: 'STAND' });
  }

  function action_split() {
    if (!canSplit) return;
    setPlayerTurn(false);
    serverAction({ action: 'SPLIT' });
  }

  function action_double() {
    if (!canDoubleDown) return;
    setPlayerTurn(false);
    serverAction({ action: 'DOUBLE-DOWN' });
  }

  function action_surrender() {
    if (!canSurrender) return;
    setPlayerTurn(false);
    serverAction({ action: 'SURRENDER' });
  }

  const cardButton = (action, condition, image) => (
    <button
      type="button"
      className="pile-button"
      onClick={action}
      disabled={condition}
      aria-label=""
    >
      <Card backOverlaySrc={image} backOverlayStyle={condition ? { opacity: 0.5 } : {}}
        card_id={0} color_id={0} size={150} flipped={true} className="pile-button__card"
      />
    </button>
  )

  return (
    <main className="table-shell">
    <div className="titleBox">BLACKJACK</div>
      <div className="table"
        onClick={resetToBet} role="button" tabIndex={0} aria-disabled={!clickReset}
      >
        <section className="dealer-area">
          {gameState.gameActive ? (
            <div className="hand-score hand-score--dealer">Dealer: {getVisibleScore(gameState.dealerScore, gameState.dealerTempScore)}</div>
          ) : null}
          <div className="hand-label"></div>
          <Hand cards={dealerCards} flip={true} />
        </section>

        <aside className="action-panel action-panel--left">
          {cardButton(action_hit, !playerTurn, "/hit_symbol.png")}
          {cardPile.length > 0 ? (
            <motion.div
              className="card-pile-stage"
              initial={{ scale: 1 }}
              animate={{ scale: 1.35 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
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
          {cardButton(action_stand, !playerTurn, "/stand_symbol.png")}
        </aside>
        { canSplit ? (
          <aside className="action-panel action-panel--right action-panel--split">
            {cardButton(action_split, !canSplit, "/split_symbol.png")}
          </aside> )
        : null }
        <section className="center-panel" aria-live="polite">
          {gameState.gameActive ? (
            <>
              <div className="center-panel__bet">Zakład: {activeHand.bet}</div>
            </>
          ) : (
            <>
              <label className="bet-field">
                <span className="bet-field__label">Postaw zakład</span>
                <input
                  className="bet-field__input"
                  type="number"
                  min="1"
                  max={user.points}
                  value={betDisplay}
                  onChange={(event) => setBetAmount(event.target.value)}
                />
              </label>
              <button type="button" className="start-button" onClick={startGame} disabled={connectionState !== 'connected' || Number(betDisplay) > currency}>
                Rozpocznij
              </button>
            </>
          )}

          {errorMessage ? <div className="center-panel__error">{errorMessage}</div> : null}
          <motion.div key={messageUpdater}
          initial={{ scaleX: '0.8', textShadow: '0 0 0px rgba(0,255,255,0)' }} animate={{ scaleX: '1', textShadow: '0 0 20px rgba(255, 251, 195, 0.6)' }} transition={{ duration: 0.15, ease: 'easeIn' }}
           className={`center-panel__status${betLocked ? ' center-panel__row--result' : ''}`}>
            {statusMessage}
          </motion.div>
          {gameState.gameActive ? (
            <div className="center-action-row">
              <button type="button" className="center-action-button" onClick={action_double} disabled={!canDoubleDown}>
                Podwój stawkę
              </button>
              <button type="button" className="center-action-button" onClick={action_surrender} disabled={!canSurrender}>
                Poddaj się
              </button>
            </div>
          ) : null}
        </section>

        <section className="player-area">
          <div className="hand-label"></div>

          <div className="side-hands side-hands--left">
            {(() => {
              const leftHands = playerHands.filter(h => h.status === 'played'); const leftHandsSize = leftHands.length;
              const visible = leftHandsSize > 3 ? leftHands.slice(0, 2) : leftHands.slice(0, 3);
              const overflow = leftHandsSize > 3 ? leftHands.length - 2 : 0;
              return (
                <>
                  {overflow > 0 && (
                    <motion.div key="handsOverflowLeft" layoutId="handsOverflowLeft" className="side-hands__overflow"
                    animate={{ scale: 0.75, opacity: 0.7 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Hand>+{overflow}...</Hand>
                    </motion.div>
                  )}
                  {visible.map(hand => (
                    <motion.div key={hand.id} layoutId={hand.id} className="side-hand" 
                    animate={{ scale: 0.75, opacity: 0.7 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Hand cards={hand.cards} cardOverlap={-80}></Hand>
                      <div className="hand-bet" style={{fontSize: '0.9rem'}}>Zakład: {hand.bet}</div>
                    </motion.div>
                  ))}
                </>
              );
            })()}
          </div>

          <LayoutGroup>
            <motion.div
              key={activeHand?.id ?? 'active'}
              layoutId={activeHand?.id}
              className="active-hand"
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Hand cards={playerCards ?? []} />
              {gameState.gameActive ? (
                <div className="hand-score hand-score--player">
                  Player: {Util.handToPoints(playerCards ?? [])}
                </div>
              ) : null}
            </motion.div>
          </LayoutGroup>

          <div className="side-hands side-hands--right">
            {(() => {
              const rightHands = playerHands.filter(h => h.status === 'queued'); const rightHandsSize = rightHands.length;
              const visible = rightHandsSize > 3 ? rightHands.slice(0, 2) : rightHands.slice(0, 3);
              const overflow = rightHandsSize > 3 ? rightHands.length - 2 : 0;
              return (
                <>
                  {visible.map(hand => (
                    <motion.div key={hand.id} layoutId={hand.id} className="side-hand"
                      animate={{ scale: 0.75, opacity: 0.7 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Hand cards={hand.cards} cardOverlap={-80}></Hand>
                      <div className="hand-bet" style={{fontSize: '0.9rem'}}>Zakład: {hand.bet}</div>
                    </motion.div>
                  ))}
                  {overflow > 0 && (
                    <motion.div key="handsOverflowRight" layoutId="handsOverflowRight" className="side-hands__overflow"
                    animate={{ scale: 0.75, opacity: 0.7 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Hand>+{overflow}...</Hand>
                    </motion.div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Blackjack;
