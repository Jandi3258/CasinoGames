export function newID() {
    return Math.random().toString(16).slice(2);
}

export function sleep(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function revealDealerCard(cards, hiddenCard) {
    return cards.map((card) => card.flipped
        ?  {...card, card_id: hiddenCard.card_id, color_id: hiddenCard.color_id, flipped: false}
        : card
    );
}

export function idToSprite( cardID ) {
    return { 
        card_id: cardID % 13, 
        color_id: Math.floor(cardID / 13),
    }
};

export function idToPoints( id ) {
    let value = id % 13;
    return {
        temp: (value === 0 ? 10 : 0),
        value: Math.min( 10, value + 1 ),
        full: Math.min( 10, value + 1 ) + (value === 0 ? 10 : 0),
    }
};

export function cardToPoints( card ) {
    return idToPoints(card.card_id);
}

export function handToPoints( cards ) {
    let total = 0;
    let aces = 0;
    cards.forEach(card => {
        let val = idToPoints(card.card_id);
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