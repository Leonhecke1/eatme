# EatMe

Veganer Kalorien-Tracker und Ernährungsplaner. Nutzer geben Körpermaße, Alltag, Sport, Ziel, Lieblingslebensmittel, Supermarkt und Wochenbudget an. Daraus berechnet EatMe den Kalorien- und Makrobedarf und erstellt einen Wochenplan mit Einkaufsliste. Rezepte lassen sich filtern, speichern und anpassen (Zutaten ergänzen, streichen, abhaken).

## Funktionen

- Konto mit E-Mail und Passwort (eigene JWT-Sessions, bcrypt, Rate-Limit in der Datenbank)
- Onboarding-Wizard und Profil: Körper, Alltag, Sport, Ziel, Mahlzeiten, Favoriten, Abneigungen, Unverträglichkeiten, Supermarkt, Budget
- Bedarfsrechner: Mifflin-St Jeor (bzw. Katch-McArdle mit Körperfett), Alltagsfaktor, Sport über MET-Werte, Zielanpassung, Makroverteilung
- Wochenplan: 3 bis 5 Mahlzeiten pro Tag, bevorzugt proteinreiche Rezepte bei Muskelaufbau, hält das Budget ein, nutzt Zutaten mehrfach, einzelne Mahlzeiten tauschen, sperren, Portionen ändern, als gegessen abhaken
- Einkaufsliste: nach Kategorie, mit Packungen und Kosten, eigene Preise pro Zutat, Vorratsartikel gesondert
- Rezepte: 76 vegane Rezepte, Filter nach Beilage (Reis, Nudeln, Kartoffeln ...), Mahlzeit, Zeit und Tags
- Gespeicherte Rezepte: eigene Version mit ergänzten, gestrichenen und abgehakten Zutaten; der Wochenplan verwendet automatisch diese Version
- Tagebuch und Heute-Ansicht, Gewichtsverlauf, Datenexport, Konto löschen
- Verwaltung (Rolle ADMIN): Rezepte, Zutaten mit Nährwerten und Richtpreisen, Supermarkt-Preisfaktoren

## Technik

Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, Prisma 7 mit PostgreSQL 16, zod, Vitest. Betrieb mit Docker Compose: App (standalone Node-Server), PostgreSQL, Caddy (HTTPS und Load-Balancing), Migrations-Job und tägliches Backup.

```
src/app/          Seiten (Route Groups: (auth), (app), admin unter (app))
src/components/   UI-Bausteine und Feature-Komponenten
src/lib/          reine Logik: Bedarfsrechner, Planer, Einkaufsliste, Preise, Datum
src/server/       Server-Code: Auth, Session, Datenzugriff, Server Actions
prisma/           Schema, Migrationen, Seed (Zutaten, Rezepte, Supermärkte)
tests/            Unit-Tests für Bedarfsrechner und Planer
```

## Lokale Entwicklung

Voraussetzungen: Node.js 24, Docker.

```bash
cp .env.example .env            # Werte anpassen, AUTH_SECRET setzen
npm install
npm run db:up                   # PostgreSQL auf Port 5433
npm run db:migrate:dev          # Migrationen anwenden
npm run db:seed                 # Zutaten, Rezepte, Supermärkte, Admin
npm run dev                     # http://localhost:3000
```

Weitere Befehle: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

Hinweis für Windows: Wenn native Next.js-Binaries von einer Anwendungssteuerung blockiert werden, laufen `dev` und `build` über `--webpack` mit den WASM-Bindings (bereits in den Skripten gesetzt).

## Deployment auf einem IONOS-Server (VPS oder Cloud Server)

1. Server mit Ubuntu anlegen, Docker und das Compose-Plugin installieren (`curl -fsSL https://get.docker.com | sh`).
2. Im IONOS-DNS einen A-Record (und bei IPv6 einen AAAA-Record) der Domain auf die Server-IP setzen.
3. In der IONOS-Firewall die Ports 80 und 443 (TCP, 443 auch UDP) freigeben.
4. Projekt auf den Server kopieren (z. B. `git clone`), dann:

```bash
cp .env.example .env
# In .env setzen: DOMAIN, ACME_EMAIL, POSTGRES_PASSWORD, AUTH_SECRET (openssl rand -base64 48),
# ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build
```

Beim Start wendet der Dienst `migrate` alle Migrationen an und befüllt eine leere Datenbank mit den Seed-Daten (`SEED_MODE=if-empty`). Änderungen aus der Verwaltung werden bei späteren Deployments nicht überschrieben. Caddy holt automatisch ein Let's-Encrypt-Zertifikat.

Das Admin-Konto durchläuft beim ersten Login ebenfalls das Onboarding. Danach ist die Verwaltung unter `/admin` erreichbar.

### Updates

```bash
git pull
docker compose up -d --build
```

### Skalierung

Die App ist zustandslos (Sessions als signierte Cookies, Rate-Limit in PostgreSQL). Mehrere App-Container laufen hinter Caddy mit Round-Robin:

```bash
APP_REPLICAS=3 docker compose up -d
```

Jeder Container hält einen eigenen Verbindungspool (`DATABASE_POOL_SIZE`, Standard 10). Bei mehreren Replikas sollte `Replikas x Poolgröße` unter `max_connections` von PostgreSQL (Standard 100) bleiben. Für stärkeres Wachstum lässt sich die Datenbank auf einen eigenen Server oder eine Managed-Datenbank auslagern, dafür reicht eine Änderung von `DATABASE_URL`.

### Backups

Der Dienst `backup` schreibt täglich einen komprimierten `pg_dump` nach `./backups` und löscht Sicherungen, die älter als `BACKUP_KEEP_DAYS` sind. Wiederherstellen:

```bash
gunzip -c backups/eatme-DATUM.sql.gz | docker compose exec -T db psql -U eatme -d eatme
```

## Datenhinweis

Nährwerte sind Richtwerte (angelehnt an BLS/USDA), Preise sind geschätzte Durchschnittspreise, die mit einem Supermarkt-Faktor angepasst werden. Nutzer können eigene Preise hinterlegen.
