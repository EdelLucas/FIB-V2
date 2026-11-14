# Einrichtung nach dem Sicherheits-Update

Die App meldet sich jetzt über **Firebase Authentication** an, und die Daten sind durch
**Firestore-Sicherheitsregeln** pro Rolle geschützt. Dafür sind einmalig ein paar Klicks in der
[Firebase Console](https://console.firebase.google.com/project/fib-lst-d75cd) nötig.
Reihenfolge bitte einhalten.

## 1. Anmeldung per E-Mail/Passwort aktivieren

Firebase Console → **Authentication** → *Get started* (falls noch nicht aktiv) →
Reiter **Sign-in method** → **E-Mail/Passwort** → *Aktivieren* → Speichern.

> Niemand braucht eine echte E-Mail-Adresse. Angemeldet wird weiter nur mit
> Zugangskennung + Passwort; die App bildet daraus intern eine Login-Adresse.

## 2. Sicherheitsregeln veröffentlichen

Firebase Console → **Firestore Database** → Reiter **Regeln** → gesamten Inhalt durch den
Inhalt der Datei [`firestore.rules`](firestore.rules) ersetzen → **Veröffentlichen**.

## 3. Neue Version online stellen und ersten Admin einrichten

Seite öffnen. Weil noch kein Admin existiert, erscheint die **Ersteinrichtung**:

- **Zugangskennung**: z. B. dein bisheriger Name (nur `a–z`, `0–9`, `.`, `-`, `_`)
- **Passwort** (2×): dein neues Passwort, mindestens 8 Zeichen
- **Bisheriges Admin-Passwort**: das Passwort, mit dem du dich bisher als `admin`
  angemeldet hast. Wurde es nie geändert, ist es das alte Standardpasswort aus dem Code.

Das alte Passwort dient nur als Nachweis, dass du berechtigt bist. Ohne diesen Schritt könnte
sich jeder Besucher als Erster zum Admin machen.

## 4. Daten übernehmen

Einstellungen → **Datenübernahme (Admin)** → *Übernahme abschließen & Altbestand löschen*.

Bis dahin liegt der alte Datenbestand noch im früheren Sammeldokument, das **jeder angemeldete
Nutzer** lesen kann (also z. B. auch CID-Daten für Nicht-CID). Erst nach diesem Schritt greift
die Trennung nach Abteilungen vollständig. Bitte daher direkt nach Schritt 3 erledigen.

## 5. Bestehende Accounts wieder aktivieren

Alte Accounts hatten nur einen Passwort-Hash in Firestore und können sich nicht mehr anmelden.
Benutzerverwaltung → Account anklicken (*alt · neu aktivieren*) → **Account aktivieren** →
temporäres Passwort weitergeben. Die Person muss es beim ersten Login ändern.

---

## Gut zu wissen

- **Passwort vergessen?** Admin → Benutzerverwaltung → *Neues Passwort vergeben*.
  Der bisherige Login wird dadurch sofort ungültig.
- **Verwaiste Logins:** Beim Neuvergeben eines Passworts oder Löschen eines Accounts bleibt
  in *Authentication → Users* ein alter, nicht mehr nutzbarer Eintrag zurück (`kennung+…@…`).
  Der ist harmlos (die Regeln lassen ihn nicht mehr rein) und kann dort gelöscht werden.
- **Klassifizierung** und **Mitarbeiter-Reihenfolge** dürfen weiterhin alle angemeldeten Nutzer
  bearbeiten (wie bisher). Abteilungsdaten (FIBCO, CID, CIRG, LAW) nur die jeweilige Rolle,
  Leaderschaft und Admins; Vorlagen nur HR; TD-Korrekturen nur TD.

### Falls die Ersteinrichtung trotz richtigem Passwort abgelehnt wird

Dann den ersten Admin von Hand in der Console anlegen (Console-Änderungen umgehen die Regeln):

1. *Authentication → Users → Nutzer hinzufügen*:
   E-Mail `deinname+start1@fib-lst-d75cd.firebaseapp.com`, Passwort nach Wahl
2. *Firestore → Daten*, jeweils Dokument anlegen:
   - `fib_users` / `deinname`: `roles` (Array) = `["admin"]`, `authKey` (String) = `start1`, `mustChange` (Boolean) = `false`
   - `fib_login` / `deinname`: `key` (String) = `start1`
   - `fib_meta` / `bootstrap`: `by` (String) = `deinname`
3. Seite neu laden und mit `deinname` + Passwort anmelden.
