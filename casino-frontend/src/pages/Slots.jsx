import React, { useState } from 'react';

const Slots = () => {
  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  const [reels, setReels] = useState(['❓', '❓', '❓']);

  const spin = () => {
    // Prosta logika losowania dla 3 bębnów
    const newReels = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    setReels(newReels);
  };

  return (
    <div className="slots-page">
      <h1>🎰 Magic Slots 🎰</h1>
      
      <div className="machine">
        <div className="reels-container">
          {reels.map((symbol, index) => (
            <div key={index} className="reel-slot">{symbol}</div>
          ))}
        </div>
        
        <button className="spin-button" onClick={spin}>SPIN!</button>
      </div>
    </div>
  );
};

export default Slots;