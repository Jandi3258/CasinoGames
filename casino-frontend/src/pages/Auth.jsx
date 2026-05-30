import { useState } from 'react';

export default function Auth({ setLoggedUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState(''); // Nowy stan na błędy

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset błędu przy każdej próbie

        if (!form.username || !form.password) {
            setError('Wpisz login i hasło!');
            return;
        }

        // Prosta walidacja długości hasła przy rejestracji
        if (!isLogin && form.password.length < 6) {
            setError('Hasło musi mieć minimum 6 znaków!');
            return;
        }

        const endpoint = isLogin ? 'login' : 'register';

        try {
            const res = await fetch(`http://localhost:8080/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                // Upewniamy się, że nie zapisujemy hasła w localStorage
                const { password: _, ...safeUser } = data.user;
                // Jeśli serwer zwrócił token, zachowujemy go wraz z użytkownikiem
                const userToStore = { ...safeUser, token: data.token };
                setLoggedUser(userToStore);
                localStorage.setItem('user', JSON.stringify(userToStore));
            } else {
                setError(data.message || 'Wystąpił błąd.');
            }
        } catch {
            setError("Brak połączenia z serwerem. Sprawdź czy backend działa.");
        }
    };

    const styles = {
        page: {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'radial-gradient(circle at top, #1f1f3d 0%, #090b11 60%)',
            color: '#f5f6fa', fontFamily: 'sans-serif'
        },
        card: {
            width: '90%', maxWidth: '420px', padding: '40px', borderRadius: '24px',
            background: 'rgba(20, 25, 40, 0.95)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center'
        },
        title: { marginBottom: '8px', fontSize: '2rem', fontWeight: '700' },
        subtitle: { marginBottom: '24px', color: '#888', fontSize: '0.9rem' },
        error: { color: '#ff4d4d', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 'bold' },
        input: {
            width: '100%', padding: '16px 18px', marginBottom: '18px', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
            color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
        },
        submit: {
            width: '100%', padding: '16px 18px', borderRadius: '16px', border: 'none',
            background: 'linear-gradient(135deg, #ffb347, #ffcc33)', color: '#111',
            fontWeight: '800', fontSize: '1rem', cursor: 'pointer', transition: '0.2s',
            boxSizing: 'border-box', marginTop: '10px'
        },
        toggle: {
            marginTop: '20px', width: '100%', padding: '14px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
            color: '#bbb', cursor: 'pointer', fontSize: '0.85rem'
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>{isLogin ? 'Witaj ponownie' : 'Stwórz konto'}</h2>
                <p style={styles.subtitle}>
                    {isLogin ? 'Zaloguj się, aby grać dalej' : 'Dołącz do zabawy w naszym kasynie'}
                </p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Twój login"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Hasło"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button type="submit" style={styles.submit}>
                        {isLogin ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}
                    </button>
                </form>

                <button
                    type="button"
                    style={styles.toggle}
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                >
                    {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
                </button>
            </div>
        </div>
    );
}