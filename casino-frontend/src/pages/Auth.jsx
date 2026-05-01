import { useState } from 'react';

export default function Auth({ setLoggedUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.username || !form.password) {
            alert('Wpisz login i hasło!');
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
                setLoggedUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Nie można połączyć się z serwerem.");
        }
    };

    const styles = {
        page: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at top, #1f1f3d 0%, #090b11 60%)',
            color: '#f5f6fa'
        },
        card: {
            width: '100%',
            maxWidth: '420px',
            padding: '40px',
            borderRadius: '24px',
            background: 'rgba(20, 25, 40, 0.95)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)'
        },
        title: {
            marginBottom: '24px',
            fontSize: '2rem',
            letterSpacing: '0.04em'
        },
        input: {
            width: '100%',
            padding: '16px 18px',
            marginBottom: '18px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box'
        },
        submit: {
            width: '100%',
            padding: '16px 18px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #ffb347, #ffcc33)',
            color: '#111',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            boxSizing: 'border-box'
        },
        toggle: {
            marginTop: '18px',
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: '#ddd',
            cursor: 'pointer',
            boxSizing: 'border-box'
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Login"
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
                        {isLogin ? 'Zaloguj' : 'Zarejestruj'}
                    </button>
                </form>
                <button
                    type="button"
                    style={styles.toggle}
                    onClick={() => setIsLogin(!isLogin)}
                >
                    Przełącz na {isLogin ? 'Rejestrację' : 'Logowanie'}
                </button>
            </div>
        </div>
    );
}