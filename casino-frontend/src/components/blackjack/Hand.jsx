import { motion } from 'motion/react';
import './Hand.css';
import Card from './Card';

const CARDS_SIZE = 150;

const SUIT_TO_ROW = {
    HEARTS: 0,
    DIAMONDS: 1,
    CLUBS: 2,
    SPADES: 3,
};

const VALUE_TO_COLUMN = {
    A: 0,
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    '10': 9,
    J: 10,
    Q: 11,
    K: 12,
};

const cardMov = {
    hidden: {opacity: 0.8, y: 40},
    visible: {opacity: 1, y: 0}
}

function hashString(value) {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) % 360;
    }

    return hash;
}

function getCardRotation(card, index) {
    const key = `${card?.suit || card?.color_id || 'hidden'}-${card?.value || card?.card_id || 'back'}-${index}`;
    return (hashString(key) % 9) - 4;
}

function toSpriteCard(card) {
    console.log('spriting: ', card)
    if (!card) {
        return null;
    }

    if (typeof card.card_id === 'number' && typeof card.color_id === 'number') {
        return {
            card_id: card.card_id,
            color_id: card.color_id,
        };
    }

    if (card.value === '?' || card.suit === 'HIDDEN') {
        return null;
    }

    return {
        card_id: VALUE_TO_COLUMN[card.value],
        color_id: SUIT_TO_ROW[card.suit],
    };
}

function Hand({ cards = [], flip = false, cardOverlap = -12, className = '', children = null }) {
    console.log(`displaying ${flip ? 'dealer' : 'player'} hand: `, cards);
    return (
        <div
            className={`Hand${flip ? ' Hand--flipped' : ''}${className ? ` ${className}` : ''}`}
            style={{ '--card-overlap': `${cardOverlap}px` }}
        >
            {cards.map((card, index) => {
                const spriteCard = toSpriteCard(card); console.log('sprited: ', spriteCard);
                const isFlipped = typeof card?.flipped === 'boolean' ? card.flipped : !spriteCard;
                const key = card?.uid || `${card?.suit || card?.color_id || 'hidden'}-${card?.value || card?.card_id || 'back'}-${index}`;

                return (
                    <motion.div
                        key={key}
                        className="Hand__cardShell"
                        layout="position"
                        transition={{
                            layout: { duration: 0.3, ease: 'easeOut' },
                            duration: 0.3,
                            ease: 'easeOut',
                        }}
                    >
                        <motion.div
                            className={spriteCard ? 'card' : 'card face-down'}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                        <Card
                            card_id={spriteCard?.card_id}
                            color_id={spriteCard?.color_id}
                            size={CARDS_SIZE}
                            flipped={isFlipped}
                            rotation={getCardRotation(card, index)}
                            style={{ zIndex: index }}
                            flipVertically={flip}
                        />
                        </motion.div>
                    </motion.div>
                );
            })}

            {children != null ? (
                <div className="Hand__bet">
                    {children}
                </div>
            ) : null}
        </div>
    );
}

export default Hand;