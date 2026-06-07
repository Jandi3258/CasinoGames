## Projekt Bazy Danych

### 1. Opis wybranych technologii
Jako system zarządzania bazą danych wybrano **PostgreSQL**. Jest to zaawansowany, relacyjny system baz danych, 
który zapewnia pełne wsparcie dla transakcji ACID. Jest to kluczowe w aplikacjach typu kasyno internetowe, 
gdzie wymagana jest bezwzględna spójność danych podczas przetwarzania zakładów w grach oraz realizowania doładowań konta użytkowników.

---

### 2. Struktura tabel

    +-------------------+
    |       USERS       |
    +-------------------+
    | PK | id           | <----+
    |    | username     |      |
    |    | password     |      |
    |    | points       |      |
    +-------------------+      |
              |                |
              | (1:N)          | (1:N)
              |                |
              v                v
    +-------------------+    +-------------------+
    |     DEPOSITS      |    |       BETS        |
    +-------------------+    +-------------------+
    | PK | id           |    | PK | id           |
    | FK | user_id      |    | FK | user_id      |
    |    | package_name |    |    | game_name    |
    |    | amount_points|    |    | bet_amount   |
    |    | cost_pln     |    |    | payout       |
    |    | created_at   |    |    | won          |
    +-------------------+    |    | created_at   |
                             +-------------------+

#### Tabela: `users`
Przechowuje profile graczy, ich dane uwierzytelniające oraz aktualny stan wirtualnych punktów.

| Kolumna | Typ danych | Atrybuty | Opis |
| :--- | :--- | :--- | :--- |
| `id` | INT / SERIAL | PRIMARY KEY, NOT NULL | Unikalny identyfikator konta użytkownika, generowany automatycznie. |
| `username` | VARCHAR | UNIQUE, NOT NULL | Unikalna nazwa użytkownika wykorzystywana jako login w aplikacji. |
| `password` | TEXT | NOT NULL | Hasło użytkownika zabezpieczone kryptograficznie (skrót generowany algorytmem bcrypt). |
| `points` | INT | DEFAULT 0, NOT NULL | Aktualne saldo punktów gracza, stanowiące wirtualną walutę do zawierania zakładów. |

#### Tabela: `deposits`
Rejestruje pełną historię wszystkich udanych, symulowanych transakcji finansowych (zasileń konta).

| Kolumna | Typ danych | Atrybuty | Opis |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, NOT NULL | Unikalny identyfikator transakcji doładowania. |
| `user_id` | INT | FOREIGN KEY, NOT NULL | Identyfikator powiązany z `users.id`, wskazujący, który gracz dokonał wpłaty. |
| `package_name` | VARCHAR | NOT NULL | Nazwa/kod wybranego pakietu punktów (np. `small`, `xlarge`). |
| `amount_points` | INT | NOT NULL | Liczba punktów dopisana do salda użytkownika w ramach tej wpłaty. |
| `cost_pln` | INT | NOT NULL | Całkowity koszt zakupu wybranego pakietu wyrażony w złotówkach (PLN). |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Dokładna data i czas zarejestrowania wpłaty. |

#### Tabela: `bets`
Przechowuje historię wszystkich zawartych przez użytkowników zakładów i wyników gier losowych.

| Kolumna | Typ danych | Atrybuty | Opis |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, NOT NULL | Unikalny identyfikator konkretnego zakładu / rozegranej rundy. |
| `user_id` | INT | FOREIGN KEY, NOT NULL | Identyfikator powiązany z `users.id`, wskazujący gracza, który obstawił dany zakład. |
| `game_name` | VARCHAR | NOT NULL | Nazwa gry, w której zawarto zakład (np. Ruletka, Sloty). |
| `bet_amount` | INT | NOT NULL | Liczba punktów (stawka) pobrana z konta użytkownika na poczet gry. |
| `payout` | INT | NOT NULL | Wartość wypłaty (wygranej) dla gracza. W przypadku przegranej przyjmuje wartość `0`. |
| `won` | BOOLEAN | NOT NULL | Flaga logiczna (`true`/`false`) informująca, czy dany zakład zakończył się wygraną gracza. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Dokładna data i czas rozegrania zakładu. |

---
### 3. Relacje i integralność danych
System opiera się na relacyjnym modelu danych, w którym tabela główna użytkowników połączona jest z tabelami zdarzeń relacjami typu **Jeden-do-Wielu (1:N)**:

* **Relacja `users` ➔ `deposits` (1:N):** Jeden użytkownik może wielokrotnie doładować swoje konto. Powiązanie pilnowane jest kluczem obcym `user_id` w tabeli `deposits` wskazującym na `id` w tabeli `users`.
* **Relacja `users` ➔ `bets` (1:N):** Jeden użytkownik może postawić wiele zakładów w systemie. Powiązanie pilnowane jest kluczem obcym `user_id` w tabeli `bets` wskazującym na `id` w tabeli `users`.
* **Więzy integralności:** Baza danych za pomocą kluczy obcych (`Foreign Keys`) dba o integralność referencyjną – nie ma możliwości przypisania zakładu ani wpłaty do użytkownika, który nie figuruje w systemie.
* **Unikalność (Unique Constraints):** Kolumna `username` uniemożliwia istnienie duplikatów kont o tym samym loginie.

---

### 4. Bezpieczeństwo i transakcyjność
* **Ochrona haseł:** Aplikacja realizuje zasadę poufności danych. Hasła użytkowników są haszowane algorytmem bcrypt przed zapisem w polu typu `TEXT`.
* **Separacja logiki (Backend-Centric):** Wszystkie operacje finansowe i hazardowe dzieją się na serwerze. Gdy gracz kręci ruletką lub maszyną, serwer najpierw sprawdza saldo, wykonuje operacje odejmowania stawki/dodawania wygranej bezpośrednio w tabeli `users`, po czym natychmiast rejestruje odpowiedni log w tabeli `bets` za pomocą bezpiecznych zapytań SQL. Frontend nie ma bezpośredniego wglądu ani uprawnień modyfikacji żadnej z tabel.
