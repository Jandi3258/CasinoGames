// src/Ruletka.jsx
import React, { useState } from 'react';

const Ruletka = () => {
  const [wynik, setWynik] = useState(null);

  const losuj = () => {
    const liczba = Math.floor(Math.random() * 37); // Losowanie 0-36
    setWynik(liczba);
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>🎡 Stół do Ruletki</h2>
      <button onClick={losuj} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Kręć kołem!
      </button>
      {wynik !== null && <h3>Wypadło: {wynik}</h3>}
    </div>
  );
};

export default Ruletka;