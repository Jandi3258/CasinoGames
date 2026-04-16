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

        console.log('Form submitted:', form, 'endpoint:', isLogin ? 'login' : 'register');
        const endpoint = isLogin ? 'login' : 'register';

        try {
            console.log('Fetching:', `http://localhost:8080/api/${endpoint}`);
            const res = await fetch(`http://localhost:8080/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);

            if (res.ok) {
                alert(`Zalogowano jako ${data.user.username}!`);
                setLoggedUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                alert(data.message); // Błędy z serwera (np. złe hasło)
            }
        } catch (error) {
            console.error("Błąd połączenia:", error);
            alert("❌ Nie można połączyć się z serwerem na http://localhost:8080\n\nUpewnij się, że uruchomiłeś backend:\ncd casino-backend && node index.js");
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Login" 
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})} 
                /><br/>
                <input 
                    type="password" 
                    placeholder="Hasło" 
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} 
                /><br/>
                <button type="submit">{isLogin ? 'Zaloguj' : 'Zarejestruj'}</button>
            </form>
            <button 
                type="button"
                onClick={() => {
                    console.log('Toggle button clicked');
                    setIsLogin(!isLogin);
                }}
            >
                Przełącz na {isLogin ? 'Rejestrację' : 'Logowanie'}
            </button>
        </div>
    );
}