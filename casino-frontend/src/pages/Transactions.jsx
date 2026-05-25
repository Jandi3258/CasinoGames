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
                headers: { 'Authorization': `Bearer ${user.token}`,
                //body: JSON.stringify({ user: user }),
            }
            });
            //console.log('Odpowiedź z serwera:', res);
            const data = await res.json();
            if (res.ok && data.success) setHistory(data.deposits || []);
            else {console.error('Błąd pobierania transakcji:', data.message); setLoading(false);}
        } catch (e) {
            console.error('Błąd pobierania historii płatności', e);
        } finally {
            setLoading(false);
        }
    };

    const totalPoints = history.reduce((s, x) => s + Number(x.amount_points || 0), 0);
    const totalCost = history.reduce((s, x) => s + Number(x.cost_pln || 0), 0);

    return (
        <div style={{ padding: '60px 20px', minHeight: '100vh', background: 'radial-gradient(circle at top right, #111 0%, #02040a 60%)', color: 'white' }}>
            <div style={{ maxWidth: 980, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#ffcc33' }}>📜 Historia transakcji</h2>
                    <div style={{ textAlign: 'right', color: '#ddd' }}>
                        <div style={{ fontWeight: 700 }}>{user.username}</div>
                        <div>Saldo: {user.points} pkt</div>
                    </div>
                </div>

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
                        <div style={{ color: '#aaa' }}>Ładuję...</div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>Brak dokonanych depozytów.</div>
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
