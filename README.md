# Someone's Store

## Frontend (steht aktuell noch nicht zur verfügung)

Das Frontend ist eine moderne React-Anwendung, die als Benutzeroberfläche für den Online-Shop dient.
Es bietet Funktionen wie Produktübersicht, Warenkorb, Benutzerregistrierung und -login, Bestellprozess, Admin-Bereich zur Verwaltung von Produkten, Kategorien, Bestellungen und Benutzern sowie Produktbewertungen.
Das Styling erfolgt mit Tailwind CSS.
Für die Kommunikation mit dem Backend wird RTK Query (Redux Toolkit Query) verwendet.
Das Frontend ist für Desktop und mobile Geräte optimiert.

## Backend

Dies ist das Backend für den Online-Shop "Someone's Store".
Es handelt sich um eine Node.js/Express-Anwendung mit MongoDB als Datenbank.
Das Backend stellt eine REST-API für Benutzerverwaltung, Produkte, Kategorien, Bestellungen und Datei-Uploads bereit.

### Features

- **Benutzerverwaltung:** Registrierung, Login, Logout, Profilverwaltung, Admin-Funktionen (CRUD für User)
- **Produkte:** CRUD für Produkte, Produktbewertungen, Filter- und Sortierfunktionen
- **Kategorien:** CRUD für Kategorien
- **Bestellungen:** Bestellungen anlegen, eigene und alle Bestellungen abrufen, als bezahlt/geliefert markieren, Umsatzstatistiken
- **Datei-Upload:** Produktbilder hochladen (nur für Admins)
- **Sicherheit:** Authentifizierung via JWT (HTTP-Only Cookies), Autorisierung für Admin-Routen, Rate Limiting, Helmet, CORS
- **API-Routen:** RESTful Endpunkte für alle Ressourcen

### Projektstruktur

    backend/
    │
    ├── __tests__/      # Integrationstests (Vitest)     
    ├── config/         # Datenbankverbindung
    ├── controllers/    # Routen-Handler (Business Logic)
    ├── middlewares/    # Express-Middlewares (Auth, Error, Form-Parsing)
    ├── models/         # Mongoose-Modelle (User, Product, Order, Category)
    ├── routes/         # API-Routen
    ├── utils/          # Hilfsfunktionen (Token, Validation, Preisberechnung)
    ├── index.js        # Einstiegspunkt/Server
    └── vitest.config.js # Test-Konfiguration

### Wichtige Umgebungsvariablen (`.env`)

- `DATABASE_URI` - MongoDB-Verbindungsstring
- `ALLOWED_ORIGINS` - Kommagetrennte Liste erlaubter CORS-Quellen
- `JWT_SECRET` - Secret für JWT-Signierung
- `PAYPAL_CLIENT_ID` - PayPal-Client-ID

### Tests

Das Backend enthält Integrationstests für die Controller (User, Produkt, Kategorie, Bestellung) mit [Vitest](https://vitest.dev/).

#### Teststruktur

    backend/
    └── __tests__/
        └── controllers/
            ├── categoryController.test.js
            ├── orderController.test.js
            ├── productController.test.js
            └── userController.test.js

#### Tests ausführen

Im Projektverzeichnis (backend) kannst du die Tests mit folgendem Befehl ausführen:

```sh
npm run test
```
oder direkt mit Vitest:
```sh
npx vitest
```

#### Hinweise

- Die Tests sind so aufgebaut, dass sie die Controller-Funktionen isoliert prüfen (Mocking von Models und Hilfsfunktionen).
- Die wichtigsten Erfolgs- und Fehlerfälle werden abgedeckt.
- Die Hilfsfunktionen wie `userResponse`, `productResponse`, `categoryResponse` und `orderResponse` werden in den Tests explizit geprüft.

### Starten des Backends

```sh
cd backend
npm install
npm run dev
```

#### API-Endpunkte

Benutzer:
- POST  /api/users - Registrierung
- POST  /api/users/auth - Login
- POST  /api/users/logout - Logout
- GET   /api/users/profile - Profil anzeigen
- PUT   /api/users/profile - Profil aktualisieren
- GET   /api/users - Alle User (Admin)
- GET/PUT/DELETE /api/users/:userId - User-CRUD (Admin)

Produkte:
- GET   /api/products - Produkte (mit Filter/Pagination)
- POST  /api/products - Produkt anlegen (Admin)
- GET/PUT/DELETE /api/products/:productId - Produkt-CRUD (Admin)
- POST  /api/products/:productId/reviews - Bewertung abgeben

Kategorien:
- GET   /api/category/categories - Alle Kategorien
- POST  /api/category - Kategorie anlegen (Admin)
- GET/PUT/DELETE /api/category/:categoryId - Kategorie-CRUD (Admin)

Bestellungen:
- POST  /api/orders - Bestellung anlegen
- GET   /api/orders/mine - Eigene Bestellungen
- GET   /api/orders - Alle Bestellungen (Admin)
- PUT   /api/orders/:orderId/pay - Als bezahlt markieren
- PUT   /api/orders/:orderId/deliver - Als geliefert markieren (Admin)

Uploads:
- POST  /api/upload - Bild hochladen (Admin)

#### Hinweise

Die statischen Uploads sind unter /uploads erreichbar.
Für die Produktion sollten alle Umgebungsvariablen korrekt gesetzt sein.
Die API ist für den Einsatz mit einem React-Frontend vorbereitet.

#### Lizenz: MIT