# UE 2026-10-06 — Normalformen 1NF–3NF (mit Prisma)

**Fach:** INFI · **Klasse:** 3AHWII X · **Zeit:** 1 DS (2 h)
**Lesson:** `lesson.html` (Prepared Lesson KM5-02, aus `unterricht/KM5-02-normalisierung/`)
**Voraussetzung:** Rep ohne Node (29.09.: SELECT/JOIN/GROUP BY fit, `node:sqlite`-Muster bekannt)

## HÜ (Abgabe)

1. **Vorhersage** — welche Spalte von `bestellung_denorm` verletzt welche Normalform?
2. **Zerlegen bis 3NF** — schrittweise, jede Stufe mit Abhängigkeitspfeil.
3. **Zwei eigene Tabellen** — zwei Quiz-Tabellen der Lesson zerlegen (CREATEs + je 3 Zeilen).
4. **Demo** — `deno task demo` im Beispielprojekt laufen lassen.
5. **Zusatz aus der Stunde** — Umsetzung mit **Prisma** (Schema + Migrate, Query statt Roh-SQL).

→ Vollständige Lösung in [`loesung.md`](./loesung.md), lauffähiges SQL in
[`zerlegung.sql`](./zerlegung.sql), Prisma-Projekt in [`praxis/`](./praxis/).

## Ablauf der UE (100 min)

| Min | Block | Material |
|-----|-------|----------|
| 0–10 | Anomalien-Aufwärmer (Bestelltabelle, Einfügen/Ändern/Löschen) | Lesson §1 |
| 10–20 | 1NF/2NF-Rep + Eselsbrücke („ganzer Schlüssel, nichts als der Schlüssel") | §2, Tafel |
| 20–35 | 3NF-Kern: transitive Kette `A → B → C`, Zerlegungsregel | §3 + Live: `deno task demo` |
| 35–70 | Fehlersuche Runde 1+2 (Quiz 1–6, Beamer) | §4–5 |
| 70–90 | Trickfälle (Quiz 7–10, bewusst „hält" dabei) + Rezept | §6–7 |
| 90–100 | HÜ erklären, Seed zeigen | §8, `seed-normalisierung.sql` |

## Dateien

| Datei | Zweck |
|-------|-------|
| `Aufgabe.md`, `hausaufgabe.md` | Aufgabenstellung (Teacher) |
| `lesson.html` | Prepared Lesson KM5-02 mit 15 interaktiven Quizzen |
| `assets/` | Lesson-Assets (`loader.js`, `lesson.css`, `theme.js`, `quiz.js`) — Ordner läuft allein |
| `loesung.md` | **meine Lösung**: Vorhersage, Zerlegung, 2 eigene Tabellen, Demo-Nachweis, Prisma-Umsetzung |
| `zerlegung.sql` | alle Zerlegungen als lauffähiges SQLite-Skript |
| `seed-normalisierung.sql` | alle Lesson-Tabellen, denormalisiert **und** normalisiert |
| `demo.ts`, `demo_test.ts` | Anomalie-Demo (Deno + `node:sqlite`) — 5 Konsolenzeilen, 4 Tests |
| `praxis/` | Prisma-7-Umsetzung der Zerlegungen (Schema, Migration, Seed, 8 Queries, 8 Tests) |

## Ausführen

### Deno-Teil (Demo, ohne Node)

```bash
deno task demo     # 5 Konsolenzeilen: 1NF, 1NF-Fix, 2NF, 2NF-Fix, 3NF
deno task test     # 4 passed
```

### Node/Prisma-Teil (Umsetzung)

```bash
cd praxis
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run run        # 8 Kontroll-Queries
npm test           # 8 passed
```

### Reine SQL-Variante

```bash
sqlite3 normalformen.db < zerlegung.sql
sqlite3 normalformen.db "SELECT * FROM bestellung;"
```

## KM-Bezug

KM3 → „Normalformen" (Lückenschluss aus Jg II) → KM5-Gesamtschau; SWP-Crossover
(Konto/BLZ, Person/PLZ) nutzt dieselbe X-Gruppe, kein neuer Stoff in SWP.
