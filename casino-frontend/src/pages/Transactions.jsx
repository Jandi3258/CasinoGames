import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Transactions = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        if (!user || !user.token) return;
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8080/api/transactions`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) setHistory(data.deposits || []);
            else {
                console.error('Błąd pobierania transakcji:', data.message); 
                setLoading(false);
            }
        } catch (e) {
            console.error('Błąd pobierania historii płatności', e);
        } finally {
            setLoading(false);
        }
    };

    const totalPoints = history.reduce((s, x) => s + Number(x.amount_points || 0), 0);
    const totalCost = history.reduce((s, x) => s + Number(x.cost_pln || 0), 0);

    return (
        <div style={{ padding: '60px 20px', minHeight: '100vh', background: 'radial-gradient(circle at top right, #2a1f4d 0%, #0a0f1e 50%, #000 100%)', color: 'white' }}>
            <div style={{ maxWidth: 980, margin: '0 auto' }}>
                
                {/* NEONOWY, WYŚRODKOWANY NAGŁÓWEK */}
                <h2 style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '15px', 
                    letterSpacing: '4px',
                    textTransform: 'uppercase', 
                    fontFamily: '"Arial Black", "Montserrat", "Impact", sans-serif',
                    fontWeight: '900',
                    color: '#fdd835', 
                    textShadow: '0 0 10px rgba(253, 216, 53, 0.6), 0 0 25px rgba(253, 216, 53, 0.4), 0 0 40px rgba(253, 216, 53, 0.2)',
                    textAlign: 'center'
                }}>
                    📜 Historia transakcji
                </h2>

                {/* WYŚRODKOWANE INFORMACJE O USERZE I SALDZIE */}
                <p style={{ 
                    color: '#ffcc33', 
                    fontSize: '1.2rem', 
                    textAlign: 'center', 
                    marginBottom: '40px', 
                    fontWeight: '600',
                    textShadow: '0 0 5px rgba(255, 204, 51, 0.3)'
                }}>
                    👤 {user.username} &nbsp;|&nbsp; 💰 Saldo: {user.points} pkt
                </p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center' }}>
                    <Link to="/payment" style={{ background: 'rgba(255,179,71,0.1)', color: '#ffcc33', padding: '8px 12px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>← Wróć do płatności</Link>
                    <button onClick={fetchHistory} style={{ background: '#284466', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>Odśwież</button>
                    <div style={{ marginLeft: 'auto', color: '#bbb' }}>
                        <div>Transakcji: <strong style={{ color: '#fff' }}>{history.length}</strong></div>
                        <div>Łącznie: <strong style={{ color: '#ffcc33' }}>{totalPoints} pkt</strong> za <strong>{totalCost} zł</strong></div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    {loading ? (
                        <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>Ładuję...</div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>Brak dokonanych depozytów.</div>
                    ) : (
                        history.map(tx => (
                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,179,71,0.05)' }}>
                                <div style={{ minWidth: 220 }}>
                                    <div style={{ fontWeight: 800, color: '#fff' }}>{tx.package_name}</div>
                                    <div style={{ color: '#bbb', marginTop: 6 }}>ID: {tx.id}</div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#ddd' }}>{new Date(tx.created_at).toLocaleString()}</div>
                                    <div style={{ marginTop: 6, color: '#bbb' }}>Szczegóły: zakup punktów za pakiet <strong>{tx.package_name}</strong></div>
                                </div>

                                <div style={{ textAlign: 'right', minWidth: 160 }}>
                                    <div style={{ color: '#ffcc33', fontWeight: 800 }}>{tx.amount_points} pkt</div>
                                    <div style={{ color: '#bbb', marginTop: 6 }}>koszt: {tx.cost_pln} zł</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;