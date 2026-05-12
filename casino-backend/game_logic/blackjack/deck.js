class Deck {
  constructor() {
    this.cards = this.initializeDeck();
    this.shuffleDeck();
  }

  initializeDeck() {
    return Array.from(
      { length: 52 }, 
      (_, index) => index
    );
  }

  shuffleDeck() {
    this.cards = this.initializeDeck();
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard() {
    if (this.cards.length === 0) {
      this.shuffleDeck();
    }
    return this.cards.pop();
  }

  cardsRemaining() {
    return this.cards.length;
  }
}

module.exports = Deck;
