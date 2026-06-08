const assert = require('node:assert');
const GameSession = require('../game_logic/blackjack/gameSession');

jest.mock('../game_logic/blackjack/deck');

var playerTokens;

async function alterPlayerTokens({username, amount}) {
    playerTokens += amount;
    return {success: true, newPoints: playerTokens};
}


describe('Blackjack', () => {
    let session;
    let ws;
    let sentMessages;

    beforeEach(() => {
        playerTokens = 1000;
        sentMessages = [];
        ws = {
            send: jest.fn((message) => {
                sentMessages.push(JSON.parse(message));
            }),
        };
        session = new GameSession('blackjack_session_test', 'testPlayer', alterPlayerTokens);
        session.init(); // is await inside index.js idk if it will mess w/ things
    });

    it('start works properly', async () => {
        await session.handleAction({ action: 'NEW_GAME', betAmount: 100 }, ws);

        assert.partialDeepStrictEqual(
            sentMessages[0],
            { action: 'START', currentBet: 100, currency: 900 }
        );
    });

    it('player busted', async () => {
        const cardSequence = [10, 0, 10, 0, 10];
        const mockDeck = {
            drawCard: jest.fn(() => cardSequence.pop())
        };

        session.deck = mockDeck;

        await session.handleAction({ action: 'NEW_GAME', betAmount: 100 }, ws);
        await session.handleAction({ action: 'HIT'}, ws);

        /*assert.partialDeepStrictEqual(
            sentMessages,
            { action: 'HIT', isPlayerBust: true }
        );*/

        let success = false;
        for ( message of sentMessages ) {
            if ( message.action === 'HIT' && message.playerBust === true ) {
                success = true;     
                break;
            }
        }

        assert.ok(success, "didn't find BUST information")
    });

});