import React, { useState } from 'react';

const Payment = ({ user, updatePoints }) => {
    const [packageId, setPackageId] = useState('small');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });

    const packages = {
        small: { points: 100, cost: 10 },
        medium: { points: 500, cost: 50 },
        large: { points: 1000, cost: 100 }
    };

    const formatCardNumber = (value) => value.replace(/\D/g, '');

    const validateCardNumber = (number) => {
        const digits = formatCardNumber(number);
        return digits.length === 16;
    };

    const validateExpiry = (expiry) => {
        const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) return false;

        const month = Number(match[1]);
        const year = Number(`20${match[2]}`);
        const expiryDate = new Date(year, month - 1, 1);
        const now = new Date();
        return expiryDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const validateCvv = (cvv) => /^\d{3,4}$/.test(cvv);

    const handlePayment = async () => {
        const selectedPackage = packages[packageId];

        if (!selectedPackage) {
            alert('Wybierz poprawny pakiet płatności.');
            return;
        }

        if (!cardData.number || !cardData.expiry || !cardData.cvv) {
            alert('Wypełnij wszystkie pola karty!');
            return;
        }

        if (!validateCardNumber(cardData.number)) {
            alert('Numer karty musi mieć 16 cyfr.');
            return;
        }

        if (!validateExpiry(cardData.expiry)) {
            alert('Data ważności musi być w formacie MM/YY i nie może być przeterminowana.');
            return;
        }

        if (!validateCvv(cardData.cvv)) {
            alert('CVV musi mieć 3 lub 4 cyfry.');
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
                const updatedUser = { ...user, points: data.newPoints };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setTimeout(() => window.location.reload(), 500);
            } else {
                alert('Błąd: ' + data.message);
            }
        } catch (error) {
            alert('Błąd połączenia z serwerem na http://localhost:8080');
        }
    };

    return (
        <div style={{ padding: '60px 30px', minHeight: '100vh', background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)', color: 'white' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px', background: 'linear-gradient(135deg, #ffb347, #ffcc33)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textAlign: 'center' }}>💳 System Płatności</h2>

                <div style={{ padding: '40px', borderRadius: '20px', background: 'rgba(40, 45, 70, 0.4)', border: '2px solid rgba(255, 179, 71, 0.3)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '30px', color: '#ffcc33' }}>💰 Saldo: {user.points} pkt</p>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', fontWeight: '600', color: '#ddd' }}>Wybierz pakiet:</label>
                        <select value={packageId} onChange={(e) => setPackageId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 179, 71, 0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}>
                            <option value="small">100 punktów - 10 zł</option>
                            <option value="medium">500 punktów - 50 zł</option>
                            <option value="large">1000 punktów - 100 zł</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid rgba(255, 179, 71, 0.2)' }}>
                        <h3 style={{ marginBottom: '20px', color: '#ffcc33' }}>Dane karty (fikcyjne)</h3>
                        <input type="text" placeholder="Numer karty" value={cardData.number} onChange={(e) => setCardData({...cardData, number: e.target.value})} style={{ width: '100%', padding: '12px 16px', marginBottom: '15px', borderRadius: '12px', border: '1px solid rgba(255, 179, 71, 0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}/>
                        <input type="text" placeholder="Data ważności (MM/YY)" value={cardData.expiry} onChange={(e) => setCardData({...cardData, expiry: e.target.value})} style={{ width: '100%', padding: '12px 16px', marginBottom: '15px', borderRadius: '12px', border: '1px solid rgba(255, 179, 71, 0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}/>
                        <input type="text" placeholder="CVV" value={cardData.cvv} onChange={(e) => setCardData({...cardData, cvv: e.target.value})} style={{ width: '100%', padding: '12px 16px', marginBottom: '20px', borderRadius: '12px', border: '1px solid rgba(255, 179, 71, 0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}/>
                    </div>

                    <button onClick={handlePayment} style={{ width: '100%', padding: '14px 20px', marginTop: '20px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #ffb347, #ffcc33)', color: '#111', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                        Zapłać i doładuj punkty
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;