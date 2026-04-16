import React, { useState } from 'react';

const Payment = ({ user, updatePoints }) => {
    const [packageId, setPackageId] = useState('small');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });

    const packages = {
        small: { points: 100, cost: 10 },
        medium: { points: 500, cost: 50 },
        large: { points: 1000, cost: 100 }
    };

    const handlePayment = async () => {
        if (!cardData.number || !cardData.expiry || !cardData.cvv) {
            alert('Wypełnij wszystkie pola karty!');
            return;
        }

        try {
            const res = await fetch('http://localhost:8080/api/deposit', {  
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, packageId })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert(data.message);
                // Zaktualizuj user object z nowymi punktami
                const updatedUser = { ...user, points: data.newPoints };
                // Zapisz do localStorage PRZED przeładowaniem
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Przeładuj stronę aby pobrać nowe dane
                setTimeout(() => window.location.reload(), 500);
            } else {
                alert('Błąd: ' + data.message);
            }
        } catch (error) {
            alert('Błąd połączenia z serwerem na http://localhost:8080');
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2>💳 System Płatności (Symulacja)</h2>
            <p>Twoje saldo: {user.points} pkt</p>

            <div>
                <label>Wybierz pakiet:</label>
                <select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                    <option value="small">100 punktów - 10 zł</option>
                    <option value="medium">500 punktów - 50 zł</option>
                    <option value="large">1000 punktów - 100 zł</option>
                </select>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Dane karty (fikcyjne dla demonstracji)</h3>
                <input type="text" placeholder="Numer karty" value={cardData.number} onChange={(e) => setCardData({...cardData, number: e.target.value})} /><br/>
                <input type="text" placeholder="Data ważności (MM/YY)" value={cardData.expiry} onChange={(e) => setCardData({...cardData, expiry: e.target.value})} /><br/>
                <input type="text" placeholder="CVV" value={cardData.cvv} onChange={(e) => setCardData({...cardData, cvv: e.target.value})} /><br/>
            </div>

            <button onClick={handlePayment} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>
                Zapłać i doładuj punkty
            </button>
        </div>
    );
};

export default Payment;