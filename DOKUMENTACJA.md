# **Casino Empire**
Interaktywny system symulacji gier opartych na prawdopodobieństwie.

---

## Imiona i nazwiska autorów
* **Paweł Janduła**
* **Bartosz Bugajski**
* **Miłosz Antas**
  
---

## Data wykonania projektu
**Marzec 2026 - Czerwiec 2026**

---

## Krótki opis projektu

### Założenia
Casino Empire to platforma internetowa realizująca zadania zintegrowanego systemu symulacji probabilistycznej z zamkniętym obiegiem wirtualnej waluty. Projekt zakłada stworzenie bezpiecznego, wydajnego i intuicyjnego środowiska webowego, w którym użytkownicy mogą zarządzać zasobami punktowymi, dokonywać symulowanych doładowań konta oraz testować algorytmy losowe w dedykowanych modułach rozgrywki w czasie rzeczywistym.

### Cele projektowe
* Zaprojektowanie i wdrożenie nowoczesnej aplikacji internetowej w architekturze klient-serwer (React na frontendzie, Node.js/Express na backendzie).
* Implementacja bezpiecznego systemu uwierzytelniania, rejestracji oraz autoryzacji użytkowników.
* Zapewnienie pełnej spójności i transakcyjności danych (ACID) przy użyciu relacyjnej bazy danych PostgreSQL.
* Stworzenie serwerowych silników losujących, odpornych na manipulacje ze strony klienta (logika w 100% scentralizowana na backendzie).
* Opracowanie estetycznego, responsywnego interfejsu graficznego dostosowanego do dynamicznej rozgrywki.

### Funkcje
* **Zarządzanie profilami:** Rejestracja, bezpieczne logowanie oraz autoryzacja użytkowników z unikalnymi identyfikatorami.
* **Integracja finansowa (Sklep):** Symulowany system płatności kartą płatniczą (z wbudowaną walidacją numeru karty, daty ważności MM/YY oraz kodu CVV) umożliwiający zakup pakietów punktowych (od *small* do *xlarge*) i płynną synchronizację salda (state) bez przeładowywania strony.
* **Moduły gier losowych:** Interaktywne środowiska symulacji gier probabilistycznych, takich jak Sloty (maszyny bębnowe) oraz Ruletka.
* **Pełny audyt transakcyjny:** Automatyczne logowanie i zapisywanie każdej operacji do bazy danych (rejestracja historii zakupów w tabeli `deposits` oraz historii stawek, wygranych i statusów gier w tabeli `bets`).
* **Zabezpieczenie kryptograficzne:** Haszowanie haseł algorytmem jednostronnym (bcrypt) oraz ukrycie logiki bazodanowej za warstwą API serwera.

### Przewidywane przeznaczenie
Platforma przeznaczona jest dla użytkowników poszukujących bezpiecznej rozrywki sieciowej opartej na grach losowych, chcących przetestować strategie zarządzania kapitałem i ryzykiem bez angażowania realnych środków finansowych. Projekt może służyć również jako środowisko demonstracyjne pokazujące bezpieczną architekturę operacji finansowych i hazardowych w aplikacjach webowych.

---

## Wybór technologii


---

## Projekt architektury aplikacji z uzasadnieniem wyboru technologii


---

## Projekt Bazy Danych

### Opis wybranych technologii
Jako system zarządzania bazą danych wybrano **PostgreSQL**. Jest to zaawansowany, relacyjny system baz danych, 
który zapewnia pełne wsparcie dla transakcji ACID. Jest to kluczowe w aplikacjach typu kasyno internetowe, 
gdzie wymagana jest bezwzględna spójność danych podczas przetwarzania zakładów w grach oraz realizowania doładowań konta użytkowników.

### Struktura tabel

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

## Jak uruchomić projekt
