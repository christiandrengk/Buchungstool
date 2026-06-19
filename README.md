# Forschungsraum – Buchungs- und Ausleihtool

Web-Tool zur **Platzbuchung** und **Geräteausleihe** für den gemeinsam genutzten
Forschungsraum des Instituts für Sonderpädagogik. v1 (MVP): ohne Login, mit voller
Transparenz – alle sehen alle Buchungen.

## Tech-Stack & Begründung

| Baustein | Wahl | Warum |
|----------|------|-------|
| Framework | **Next.js 14 (App Router, TypeScript)** | Frontend + API in einer Codebasis; später leicht als iframe/Link in die Institutswebseite einbettbar |
| Datenbank | **SQLite** (via Prisma) | Leichtgewichtiger Start; mehrere Personen können parallel buchen |
| ORM/Migrationen | **Prisma** | Versionierte Migrationen; Wechsel zu **PostgreSQL** ist nur ein `provider`- + `DATABASE_URL`-Wechsel – das Datenmodell bleibt gleich |
| UI | **Tailwind CSS** | Schlankes, responsives, klares UI für nicht-technisches Publikum |

> Warum nicht reines Datei-/Browser-Storage? Weil mehrere Abteilungen parallel
> buchen – das braucht eine gemeinsame Datenbank mit serverseitiger Konfliktprüfung.

## Funktionsumfang v1

- **Zeitraum-Auswahl**: Monats-Kalender, Tage per Maus aufziehen (einzeln oder
  mehrtägig); optional konkrete Uhrzeiten, sonst ganztägig (07–21 Uhr).
- **Platzbuchung**: 4 Testplätze + 2 Arbeitsplätze; mehrere gleichzeitig wählbar.
- **Geräteausleihe**: alle Gerätekategorien; mehrere Kategorien mit Anzahl in einem
  Vorgang, das System teilt automatisch freie Exemplare zu. Anzeige
  *gesamt / buchbar / aktuell frei*.
- **Transparenz**: alle Buchungen (wer, was, wann, welche Abteilung) für alle sichtbar.
- **Kein Login**: Pflichtfelder Name + Abteilung (Dropdown der 11 Abteilungen);
  E-Mail optional.
- **Verwaltung**: Kategorien und Geräte anlegen/entfernen, Eigentümer zuordnen,
  Exemplare als Sockel/Puffer („nicht buchbar") markieren – Pflege über die Seite
  **Verwaltung**. Nicht buchbare Exemplare werden in der Verfügbarkeit ausgegraut.
- **Konfliktprüfung**: serverseitig, transaktionssicher – keine Doppelbuchungen
  desselben Platzes/Exemplars bei Zeitüberschneidung.
- **E-Mail (optional)**: für Buchungsbestätigung/Erinnerung (Versand folgt in
  Phase 2 mit dem Deployment; ohne E-Mail keine Benachrichtigung).
- **Nutzungsart** bei Geräten: *Ausleihe (Mitnahme)* oder *Nutzung im Raum*.
- **Regeln für Studierende** (serverseitig durchgesetzt; Rolle in v1 selbst
  gewählt, bis Login existiert):
  - Owl & 3D-Brille nur „Nutzung im Raum", keine Ausleihe (Kategorie-Flag
    `studentsInRoomOnly`).
  - maximale Buchungsdauer **7 Kalendertage**. Mitarbeitende: keine Beschränkung.

## Datenmodell (Kurzüberblick)

- **Department** – die 11 Abteilungen.
- **ResourceCategory** – buchbare Kategorie (`PLACE` oder `DEVICE`), optional mit
  Eigentümer-Abteilung, `studentsAllowed` und `studentsInRoomOnly` (Regeln für
  Studierende).
- **ResourceItem** – konkretes Exemplar (z. B. „iPad #03"), optional `unavailableReason`
  (`SOCKEL`/`PUFFER`) und eigene Eigentümer-Abteilung.
- **Booking** – Buchung eines Exemplars in einem Zeitraum, mit `bookerName`,
  `bookerEmail`, `department`, `role` und `usageType` (`TAKEOUT`/`IN_ROOM`).

**Bewusst für später vorbereitet, in v1 nicht erzwungen:** vollständige Rollenlogik
inkl. **Login** (die Rolle wird in v1 selbst gewählt; die Regeln greifen serverseitig,
aber ohne Identitätsprüfung). Eigentümerschaft und Priorisierung lassen sich auf dem
bestehenden Schema aufbauen.

Schema: [`prisma/schema.prisma`](prisma/schema.prisma) · Startbestand: [`prisma/seed.ts`](prisma/seed.ts)

## Lokal starten

Voraussetzung: Node.js ≥ 18 (getestet mit Node 22).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env

# 3. Datenbank anlegen (Migration) und mit Startbestand füllen
npm run db:migrate      # legt SQLite-DB + Tabellen an
npm run db:seed         # füllt Abteilungen, Plätze, Geräte (inkl. Sockel/Puffer)

# 4. Entwicklungsserver starten
npm run dev
```

Dann <http://localhost:3000> öffnen.

## Daten zurücksetzen

```bash
npm run db:reset    # DB löschen, neu migrieren und automatisch neu seeden
```

(Alternativ einfach die Datei `prisma/dev.db` löschen und `db:migrate` + `db:seed`
erneut ausführen.)

> **Wichtig nach einem `git pull` mit Datenbank-Änderungen:** Wenn neue Felder/Spalten
> hinzugekommen sind (z. B. E-Mail, Nutzungsart), die alte `dev.db` aber noch besteht,
> schlagen Abfragen fehl (z. B. bleiben Platz-/Geräteauswahl leer). Dann einmal
> `npm run db:reset` ausführen und den Dev-Server neu starten.

Datenbank-Inhalte komfortabel anschauen/bearbeiten:

```bash
npm run db:studio   # öffnet Prisma Studio im Browser
```

## Nützliche Skripte

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` / `npm start` | Produktionsbuild / -start |
| `npm run db:migrate` | Migration anlegen/anwenden |
| `npm run db:seed` | Startbestand einspielen |
| `npm run db:reset` | DB komplett zurücksetzen + neu seeden |
| `npm run db:studio` | Prisma Studio |

## Abteilungen anpassen

Die Abteilungsnamen im Seed (`prisma/seed.ts`, Konstante `DEPARTMENTS`) sind
Platzhalter (klassische Förderschwerpunkte + Mathe/PKGB). Bitte an die echten 11
Abteilungen anpassen und neu seeden.

## Spätere Erweiterungen (vorgesehen)

- **Rollen/Auth**: `Role`-Enum und `studentsAllowed` existieren bereits; Login und
  Durchsetzung (z. B. Meeting Owl/3D-Brille nicht für Studierende) ergänzbar.
- **Priorisierung bei Engpässen**: auf Basis von `role`/`department` ergänzbar.
- **PostgreSQL**: in `prisma/schema.prisma` `provider = "postgresql"` setzen,
  `DATABASE_URL` anpassen, `prisma migrate deploy` ausführen.
- **iframe-Einbettung**: erlaubte Eltern-Domain über `ALLOWED_FRAME_ANCESTOR`
  in `.env` setzen (siehe `next.config.mjs`).

## Deployment / GitHub (Skizze)

```bash
git add .
git commit -m "Buchungstool v1"
git push -u origin <branch>
```

Für ein echtes Deployment empfiehlt sich ein Host mit persistenter Datenbank
(z. B. Railway/Render/eigener Server) und **PostgreSQL** statt SQLite, da viele
Serverless-Hosts kein dauerhaftes Dateisystem für SQLite bieten.

---

**Status:** v1 (MVP) · Ohne Authentifizierung · Für internen Gebrauch im Institut.
