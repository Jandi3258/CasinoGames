import { useState } from 'react';

export default function Auth({ setLoggedUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? 'login' : 'register';
        const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await res.json();
        if (res.ok) {
            setLoggedUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user)); // Zapisujemy sesję
        } else {
            alert(data.message);
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