# Lösung — Normalformen 1NF–3NF (mit Prisma)

Abgabe zu `Aufgabe.md` / `hausaufgabe.md` (UE 2026-10-06, KM5-02).
Ordner: `2026-10-06_normalformen/`

| Datei | Inhalt |
|---|---|
| `zerlegung.sql` | alle Zerlegungen als lauffähiges SQLite-Skript |
| `demo.ts`, `demo_test.ts` | Anomalie-Demo des Beispielprojekts (Deno, `node:sqlite`) |
| `seed-normalisierung.sql` | alle Lesson-Tabellen, denormalisiert **und** normalisiert |
| `praxis/` | **Prisma-7-Umsetzung** der Zerlegungen (Migrate statt CREATE, Prisma-API statt Roh-SQL) |

---

## 1. Vorhersage (vor dem Zerlegen notiert)

Ausgangstabelle `bestellung_denorm(bestell_nr, kunde, plz, ort)`:

| bestell_nr | kunde | plz | ort |
|---|---|---|---|
| 101 | Auer | 1020 | Wien |
| 102 | Beck | 1020 | Wien |
| 103 | Cevik | 4020 | Linz |

**Vorhersage: Die Spalte `ort` verletzt die 3NF.**

- **Warum 3NF?** Der Ort ist eine Tatsache über die **PLZ**, nicht über die Bestellung.
  Es gibt die transitive Abhängigkeit `bestell_nr → plz → ort`. `ort` hängt also nicht
  direkt vom Primärschlüssel ab, sondern über `plz` — das ist genau die Definition
  einer transitiven Abhängigkeit.
- **Warum nicht 1NF?** Alle Werte sind atomar: eine PLZ pro Zelle, ein Ort pro Zelle,
  keine Liste, keine Wiederholgruppe (`track1`, `track2`, …).
- **Warum nicht 2NF?** Der Primärschlüssel `bestell_nr` ist **einzeln**. Es gibt keinen
  zusammengesetzten Schlüssel, dessen Teil eine partielle Abhängigkeit tragen könnte.
  → **2NF ist hier kein Thema.** (Die Lesson fragt das ausdrücklich: „Ist die 2NF hier
  überhaupt ein Thema?" — Antwort: nein.)
- **Anomalie-Vorhersage:** Wenn jemand in Zeile 101 `ort` auf „Wien (neu)" ändert,
  stehen in der Tabelle danach **zwei verschiedene Orte für dieselbe PLZ 1020**.
  Das ist die Änderungs-Anomalie, die die Zerlegung beseitigt.

**Bestätigt durch den Demo-Lauf:** `3NF: PLZ 1020 hat 2 verschiedene Orte (Ort hängt an PLZ).`

---

## 2. Zerlegen bis 3NF (mit Abhängigkeitspfeil)

### Schritt 0 — Ausgangstabelle

```
bestellung_denorm(bestell_nr PK, kunde, plz, ort)

  bestell_nr ──→ kunde
  bestell_nr ──→ plz
  bestell_nr ──→ ort        ← transitiv über plz
```

### Schritt 1 — Transitive Kette auflösen (3NF)

```
bestell_nr ──→ plz ──→ ort
```

Pfeil-Begründung: `ort` hängt an `plz`, und `plz` hängt an `bestell_nr`. Also wird
`ort` in eine eigene Faktentabelle ausgelagert; `bestellung` behält nur den
Fremdschlüssel `plz`.

```
bestellung(bestell_nr PK, kunde, plz FK)      plz(plz PK, ort)
```

```sql
DROP TABLE IF EXISTS plz;
CREATE TABLE plz(
  plz TEXT PRIMARY KEY,
  ort TEXT NOT NULL
);
INSERT INTO plz(plz, ort) VALUES
  ('1020', 'Wien'),
  ('4020', 'Linz'),
  ('8010', 'Graz');

DROP TABLE IF EXISTS bestellung;
CREATE TABLE bestellung(
  bestell_nr INTEGER PRIMARY KEY,
  kunde      TEXT NOT NULL,
  plz        TEXT NOT NULL REFERENCES plz(plz)
);
INSERT INTO bestellung(bestell_nr, kunde, plz) VALUES
  (101, 'Auer',  '1020'),
  (102, 'Beck',  '1020'),
  (103, 'Cevik', '4020');
```

**Ergebnis:** Jede Tatsache steht genau einmal. Eine PLZ kann jetzt nicht mehr zwei
Orte haben, weil `plz` der Primärschlüssel der Ort-Tabelle ist.

### Schritt 2 — Kontrolle (Anomalie-Probe)

```
SELECT COUNT(DISTINCT ort) FROM bestellung_denorm WHERE plz = '1020';  -- vorher: 2
SELECT COUNT(*)               FROM plz              WHERE plz  = '1020';  -- nachher: 1
```

Die zweite Abfrage kann konstruktionsbedingt nie > 1 liefern — das ist der Beweis,
dass die Anomalie strukturell eliminiert ist und nicht nur „gerade nicht auftritt".

### Interleaving — die ursprüngliche Bestellung wieder zusammensetzen

```sql
SELECT b.bestell_nr, b.kunde, p.ort, s.titel
FROM bestellung b
JOIN plz p          ON p.plz = b.plz
JOIN bestellposition bp ON bp.bestell_nr = b.bestell_nr
JOIN song s         ON s.song_id = bp.track_id
ORDER BY b.bestell_nr, bp.position;
```

Ergebnis (aus `zerlegung.sql` verifiziert):

```
101 | Auer | Wien | Silent Lines
101 | Auer | Wien | Night Ferry
102 | Beck | Wien | Dust Choir
```

---

## 3. Zwei eigene Quiz-Tabellen zerlegt

### 3a. `song_playlist_denorm` (Quiz 7) — 2NF-Verletzung

Ausgangstabelle `song_playlist_denorm(song_id, playlist_id, song_titel)`, PK `(song_id, playlist_id)`.

```
  song_id ──→ song_titel      ← hängt nur an einem TEIL des zusammengesetzten Schlüssels
```

Pfeil-Begründung: `song_titel` ist eine Tatsache über den **Song**, nicht über die
*Paarung* Song/Playlist. Der zusammengesetzte PK trägt eine **partielle
Abhängigkeit** → 2NF verletzt. Fix: Song-Entität auslagern, die Zwischentabelle
behält nur noch die Beziehung.

```sql
DROP TABLE IF EXISTS song;
CREATE TABLE song(
  song_id   INTEGER PRIMARY KEY,
  titel     TEXT NOT NULL,
  dauer_sek INTEGER NOT NULL
);
INSERT INTO song(song_id, titel, dauer_sek) VALUES
  (1, 'Silent Lines', 215),
  (2, 'Night Ferry', 240),
  (3, 'Dust Choir', 198);

DROP TABLE IF EXISTS playlist;
CREATE TABLE playlist(
  playlist_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL
);
INSERT INTO playlist(playlist_id, name) VALUES
  (10, 'Fokus'),
  (20, 'Nachtfahrt');

DROP TABLE IF EXISTS song_playlist;
CREATE TABLE song_playlist(
  song_id     INTEGER NOT NULL REFERENCES song(song_id),
  playlist_id INTEGER NOT NULL REFERENCES playlist(playlist_id),
  PRIMARY KEY(song_id, playlist_id)
);
INSERT INTO song_playlist(song_id, playlist_id) VALUES
  (1, 10),
  (1, 20),
  (2, 20);
```

**Kontrolle:** `song_id = 1` liegt in zwei Playlists, der Titel steht aber nur **einmal**
(in `song`). Die Update-Anomalie („Titel nur in einer Zeile geändert") ist weg.

### 3b. `konto_denorm` (Quiz 13) — 3NF-Verletzung, SWP-Crossover

Ausgangstabelle `konto_denorm(iban, inhaber, blz, bankname)`, PK `iban`.

```
  iban ──→ blz ──→ bankname      ← transitive Kette
```

Pfeil-Begründung: Der Bankname ist eine Tatsache über die **BLZ**, nicht über das
Konto. `iban → blz` und `blz → bankname` ergeben die transitive Abhängigkeit
`iban → bankname`. Fix: BLZ-Entität auslagern.

```sql
DROP TABLE IF EXISTS blz;
CREATE TABLE blz(
  blz      TEXT PRIMARY KEY,
  bankname TEXT NOT NULL
);
INSERT INTO blz(blz, bankname) VALUES
  ('1000', 'Erste Bank'),
  ('2000', 'Oberbank'),
  ('3000', 'Alpenbank');

DROP TABLE IF EXISTS konto;
CREATE TABLE konto(
  iban    TEXT PRIMARY KEY,
  inhaber TEXT NOT NULL,
  blz     TEXT NOT NULL REFERENCES blz(blz)
);
INSERT INTO konto(iban, inhaber, blz) VALUES
  ('AT01', 'Auer',  '1000'),
  ('AT02', 'Beck',  '1000'),
  ('AT03', 'Cevik', '2000');
```

**Kontrolle:** `AT01` und `AT02` teilen sich die BLZ 1000 → beide zeigen
„Erste Bank", aber der Name steht nur **einmal** in `blz`. Vor der Zerlegung hätte
man „Erste Bank" zweimal in `konto_denorm` geschrieben — und beim Umbenennen der
Bank wäre eine Zeile hängen geblieben.

### Weitere Zerlegungen (im Seed-Skript mitgeliefert)

Damit das Bild vollständig ist, enthält `zerlegung.sql` zusätzlich:

| Ausgangstabelle | Verletzung | Zerlegung |
|---|---|---|
| `kunde_hobby_denorm` (hobbys = "Lesen, Schwimmen") | 1NF (Liste in der Zelle) | `kunde` + `hobby` |
| `bestellung_repeat` (track1/track2/track3) | 1NF (Wiederholgruppe) | `bestellung` + `bestellposition` |
| `bestellposition_prod_denorm` (produkt_name) | 2NF (partielle Abh.) | `produkt` + `bestellposition_prod` |
| `pruefung` (matr_nr, lv_nr, note) | **hält 2NF** | keine Zerlegung nötig — die Note hängt an beiden Schlüsselteilen |
| `person_denorm` (svnr, name, plz, ort) | 3NF (transitiv) | `person` + `plz` |

---

## 4. Demo — Nachweis

Vollständige Ausführung von `demo.ts` (Lesson-Tabellen + eigene HÜ-Tabellen) via `deno task demo`:

```
1NF: WHERE hobbys = 'Schwimmen' findet 0 Zeilen (die Zelle ist eine Liste).
1NF-Fix: eine Zeile pro Wert -> 1 Treffer.
2NF: song_id 1 hat 2 verschiedene Titel (Titel hängt nur an song_id).
2NF-Fix: der Titel steht 1 Mal fuer song_id 1.
3NF: PLZ 1020 hat 2 verschiedene Orte (Ort hängt an PLZ).
3NF-Fix: PLZ 1020 steht 1 Mal in Tabelle plz.
2NF (eigene Tabelle bestellposition): produkt_id 42 hat 2 verschiedene Produktnamen (partielle Abhängigkeit).
2NF-Fix: produkt_id 42 steht 1 Mal in Tabelle produkt.
3NF (eigene Tabelle konto_denorm): BLZ 1000 hat 2 verschiedene Banknamen (transitive Abhängigkeit).
3NF-Fix: BLZ 1000 steht 1 Mal in Tabelle blz.
```

`deno task test` → **6 passed | 0 failed** (alle 4 Lesson-Tests + 2 Tests zu den eigenen HÜ-Tabellen grün).

---

## 5. Zusatz aus der Stunde: Umsetzung mit Prisma

Der Ordner `praxis/` setzt **dieselben Zerlegungen** mit Prisma 7 um
(SQLite, `better-sqlite3`-Adapter, analog zum KM5-01-Scaffold).

### Setup

```bash
npm install
cp .env.example .env
npm run db:migrate      # erzeugt die Tabellen per Migration (nicht per freiem CREATE)
npm run db:seed
npm run run             # 8 Kontroll-Queries
npm test                # 8 Tests
```

### Prisma-Schema (`praxis/prisma/schema.prisma`)

| Normalform | Modelle |
|---|---|
| 1NF | `Kunde` + `Hobby` (Kombination aus `@@id([kundeId, hobby])`), `Bestellung` + `Bestellposition` (statt track1/2/3) |
| 2NF | `Song` + `Playlist` + `SongPlaylist` (N:M), `Produkt` + `BestellpositionProd`, `Pruefung` (hält 2NF) |
| 3NF | `Plz` + `Bestellung`, `Blz` + `Konto`, `Plz` + `Person` |

Die Fremdschlüssel sind echte Prisma-Relationen (`@relation`), die Zerlegungen also
nicht nur benannt, sondern vom ORM durchgesetzt:

```prisma
model Bestellung {
  bestellNr Int    @id @default(autoincrement())
  kunde     String
  plz       String
  plzRef    Plz    @relation(fields: [plz], references: [plz])
  positionen Bestellposition[]
}
```

### Query statt Roh-SQL

Die Kontroll-Fragen laufen über die Prisma-API, nicht über `$queryRaw`:

```js
// 3NF-Kontrolle: Hat eine PLZ mehr als einen Ort?
const gruppen = await prisma.plz.groupBy({
  by: ["plz"],
  _count: { _all: true },
});
```

```js
// Interleaving: Bestellung inkl. Ort und Track-Titeln
const bestellung = await prisma.bestellung.findUnique({
  where: { bestellNr },
  include: {
    plzRef: true,
    positionen: { include: { track: true }, orderBy: { position: "asc" } },
  },
});
```

**Ausgabe von `npm run run`:**

```
1) Orte pro PLZ (3NF):     [ { plz: '1020', anzahlOrte: 1 },
                               { plz: '4020', anzahlOrte: 1 },
                               { plz: '8010', anzahlOrte: 1 } ]
2) Bestellungen mit Ort:   [ { bestellNr: 101, kunde: 'Auer', plz: '1020', ort: 'Wien' },
                               { bestellNr: 102, kunde: 'Beck', plz: '1020', ort: 'Wien' },
                               { bestellNr: 103, kunde: 'Cevik', plz: '4020', ort: 'Linz' } ]
3) Bestellung 101 + Tracks: { bestellNr: 101, kunde: 'Auer', ort: 'Wien',
                               tracks: [ 'Silent Lines', 'Night Ferry' ] }
4) Songs pro Playlist:     [ { name: 'Fokus', anzahl: 1 },
                               { name: 'Nachtfahrt', anzahl: 2 } ]
5) Hobbys pro Kunde (1NF): [ { name: 'Auer', hobbys: [ 'Lesen', 'Schwimmen' ] },
                               { name: 'Beck', hobbys: [ 'Schach' ] },
                               { name: 'Cevik', hobbys: [] } ]
6) Produktpositionen:       [ { bestellNr: 101, produkt: 'Kabel', menge: 2 },
                               { bestellNr: 101, produkt: 'Stecker', menge: 1 },
                               { bestellNr: 102, produkt: 'Kabel', menge: 5 } ]
7) Konten mit Bank:         [ { iban: 'AT01', inhaber: 'Auer', bankname: 'Erste Bank' },
                               { iban: 'AT02', inhaber: 'Beck', bankname: 'Erste Bank' },
                               { iban: 'AT03', inhaber: 'Cevik', bankname: 'Oberbank' } ]
8) Konten pro BLZ:          [ { blz: '1000', anzahlKonten: 2 },
                               { blz: '2000', anzahlKonten: 1 },
                               { blz: '3000', anzahlKonten: 1 } ]
```

### Testergebnis `npm test` (node:test)

```
1..8
# tests 8
# pass 8
# fail 0
```

Die Tests prüfen die Anomalie-Freiheit direkt:
`3NF: jede PLZ hat genau einen Ort`, `3NF: Bestellungen holen ihren Ort über die FK`,
`Interleaving: Bestellung 101 kommt mit ihren Track-Titeln zurück`,
`1NF: Kunde Auer hat zwei Hobbys, je eine Zeile`,
`2NF: Produktname steht genau einmal (in der Produkt-Tabelle)`,
`3NF SWP-Crossover: zwei Konten teilen sich eine Bank`.

### Zwei Stolpersteine, die ich im Prisma-Umbau gelernt habe

1. **Prisma 7 erlaubt im `groupBy` keine Relations-Counts** (`_count: { konten: true }`
   schlägt fehl). Lösung: über die FK gruppieren (`prisma.konto.groupBy({ by: ["blz"] })`)
   oder `findMany` mit `include: { _count: ... }` verwenden.
2. **`groupBy` liefert nur IDs, keine Namen** — für „Songs pro Playlist" mit Namen
   braucht es ein zweites `findMany` und ein `Map` zum Zuordnen, oder man nutzt gleich
   `include: { _count: { select: { songs: true } } }` auf `playlist.findMany`.

---

## Zusammenfassung

- **Vorhersage:** `ort` verletzt die 3NF (transitiv über `plz`); 1NF und 2NF sind
  unauffällig, 2NF gar nicht thematisch (einfacher Primärschlüssel).
- **Zerlegung:** `bestellung_denorm` → `bestellung` + `plz` (Fremdschlüssel auf `plz`).
- **Zwei eigene Tabellen:** `song_playlist_denorm` (2NF) → `song` + `playlist` +
  `song_playlist`; `konto_denorm` (3NF) → `konto` + `blz`.
- **Demo:** 5 Konsolenzeilen, 4 Deno-Tests grün.
- **Prisma:** alle Zerlegungen als Schema mit Migration, Seed, 8 Kontroll-Queries
  und 8 grünen Tests.
