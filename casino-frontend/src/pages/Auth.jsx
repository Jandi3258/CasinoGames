import { useState } from 'react';

export default function Auth({ setLoggedUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                alert(data.message); // Błędy z serwera (np. złe hasło)
            }
        } catch (error) {
            // Ten blok wykona się, gdy port 8080 jest zamknięty
            console.error("Błąd połączenia:", error);
            alert("Nie można połączyć się z serwerem. Upewnij się, że backend na porcie 8080 jest uruchomiony!");
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Login" onChange={e => setForm({...form, username: e.target.value})} /><br/>
                <input type="password" placeholder="Hasło" onChange={e => setForm({...form, password: e.target.value})} /><br/>
                <button type="submit">{isLogin ? 'Zaloguj' : 'Zarejestruj'}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)}>
                Przełącz na {isLogin ? 'Rejestrację' : 'Logowanie'}
            </button>
        </div>
    );
}