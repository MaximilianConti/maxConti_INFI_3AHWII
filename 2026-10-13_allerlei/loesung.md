# Lösung — KM5-05 Drizzle ORM

Abgabe zur Aufgabe `2026-10-13_allerlei` / `KM5-05-drizzle-orm` (INFI, 3AHWII X).  
Ordner: `2026-10-13_allerlei/`

| Datei | Inhalt |
|---|---|
| `schema.ts` | Drizzle-Tabellendefinitionen (`artist`, `album`, `track`) |
| `db.ts` | SQLite-Verbindung via `node:sqlite` + DDL-Setup |
| `demo.ts` | Vollständiger Demo-Ablauf inklusive der 3 geforderten HÜ-Queries |
| `demo_test.ts` | 12 Tests (9 Original + 3 neue HÜ-Tests) |
| `deno.json` | Aufgaben-Tasks (`demo`, `test`) |

---

## 1. Vorhersage (vor dem Ausführen notiert)

### Query a
```ts
db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))
```

* **Spaltenliste:**
  `.select()` ohne Parameter selektiert alle im Drizzle-Schema `artist` definierten Spalten:
  `"id"`, `"name"`, `"gruendungsjahr"`.
* **WHERE-Klausel:**
  `where "artist"."gruendungsjahr" = ?`
  (Drizzle nutzt Identifier-Quoting und parametrisiert Werte standardmäßig mit Platzhaltern `?`).
* **Parameter:**
  `[1999]` (der Integer wird getrennt als Parameter übergeben, nicht im SQL-String interpoliert).
* **Erzeugtes SQL (Drizzle `toSQL()`):**
  ```sql
  select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
  ```
  Parameter: `[1999]`
* **Rückgabetyp:** `Array<{ id: number, name: string, gruendungsjahr: number | null }>`

---

### Query b
```ts
db.select({ n: count() }).from(album).where(eq(album.artistId, 1))
```

* **Spaltenliste:**
  Es wird explizit ein Projektions-Objekt übergeben: `{ n: count() }`.
  Drizzle generiert dafür `count(*) as "n"` (Drizzle übersetzt `count()` standardmäßig zu `count(*)`).
* **WHERE-Klausel:**
  Im Schema ist das Feld als `artistId: integer("artist_id")` definiert. Drizzle übersetzt den TypeScript-Attributnamen `album.artistId` typsicher auf die physische Datenbankspalte `"album"."artist_id" = ?`.
* **Parameter:**
  `[1]`
* **Erzeugtes SQL (Drizzle `toSQL()`):**
  ```sql
  select count(*) as "n" from "album" where "album"."artist_id" = ?
  ```
  Parameter: `[1]`
* **Rückgabetyp:** `Array<{ n: number }>`

---

## 2. Beispielprojekt erweitern (`demo.ts`)

Die folgenden drei Queries wurden in `demo.ts` ergänzt und mit `toSQL()` sowie Konsolenausgaben versehen:

### 1. Ältestes Album (`orderBy` + `limit`)
```ts
const aeltestesQuery = db.select()
  .from(album)
  .orderBy(asc(album.jahr))
  .limit(1);

const aeltestes = await aeltestesQuery;
console.log("Ältestes Album:", aeltestes[0].titel, "(", aeltestes[0].jahr, ")");
```
* **Erzeugtes SQL:**
  ```sql
  select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
  ```
  Parameter: `[1]`
* **Ergebnis:** `"Night Ferry" ( 2012 )`

### 2. Tracks eines Albums mit Titel-Anfang „Echo“ (`and` + `eq` + `like`)
```ts
const echoQuery = db.select()
  .from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));

const echoTracks = await echoQuery;
console.log("Tracks mit 'Echo%':", echoTracks.map((t) => t.titel));
```
* **Erzeugtes SQL:**
  ```sql
  select "id", "titel", "dauer_sek", "album_id" from "track" where ("track"."album_id" = ? and "track"."titel" like ?)
  ```
  Parameter: `[1, "Echo%"]`
* **Ergebnis:** `["Echo Room"]`

### 3. Anzahl Tracks je Album (`count` + `groupBy`)
```ts
const tracksProAlbumQuery = db.select({
  albumId: track.albumId,
  titel: album.titel,
  trackAnzahl: count(),
})
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(track.albumId, album.titel);

const tracksJeAlbum = await tracksProAlbumQuery;
console.log("Anzahl Tracks je Album:", tracksJeAlbum);
```
* **Erzeugtes SQL:**
  ```sql
  select "track"."album_id", "album"."titel", count() as "trackAnzahl" from "track" inner join "album" on "track"."album_id" = "album"."id" group by "track"."album_id", "album"."titel"
  ```
* **Ergebnis:** `[{ albumId: 1, titel: 'Silent Lines', trackAnzahl: 2 }]`

---

## 3. SQL-Vergleich (Interleaving)

### Reines SQL (Raw SQL):
```sql
SELECT
  track.album_id,
  album.titel,
  COUNT() AS track_anzahl
FROM track
INNER JOIN album ON track.album_id = album.id
GROUP BY track.album_id, album.titel;
```

### Drizzle-Query:
```ts
db.select({
  albumId: track.albumId,
  titel: album.titel,
  trackAnzahl: count(),
})
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(track.albumId, album.titel);
```

### Baustein-Vergleich:

| Baustein | Reines SQL | Drizzle ORM | Erklärung |
|---|---|---|---|
| **SELECT** | `SELECT track.album_id, album.titel, COUNT() AS track_anzahl` | `.select({ albumId: track.albumId, titel: album.titel, trackAnzahl: count() })` | Drizzle baut die Spaltenliste und Aliase aus dem übergebenen Objekt und typisiert das Resultat exakt nach den TS-Typen. |
| **FROM** | `FROM track` | `.from(track)` | Quelltabelle als typisiertes Schema-Objekt. |
| **INNER JOIN** | `INNER JOIN album ON track.album_id = album.id` | `.innerJoin(album, eq(track.albumId, album.id))` | Drizzle mappt die TS-Eigenschaft `track.albumId` auf die Spalte `"album_id"`. |
| **GROUP BY** | `GROUP BY track.album_id, album.titel` | `.groupBy(track.albumId, album.titel)` | Aggregation nach den Gruppierungsschlüsseln. |
| **Identifier Quoting** | Manuell oder unquoted | Automatisch (`"track"."album_id"`) | Schützt vor reservierten SQL-Keywords und Sonderzeichen. |
| **Typsicherheit** | Keine Überprüfung vor Laufzeit | Vollständige Compiler-Prüfung | Tippfehler bei Spaltennamen (z. B. `track.album_ID`) werden direkt zur Compile-Zeit von TypeScript gemeldet. |

---

## 4. Nachweis: Ausführen & Tests

### Konsolenausgabe (`deno task demo`):
```text
Lesen, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" where "album"."artist_id" = ?
Lesen, Parameter: [ 1 ]
Lesen, Ergebnis: [ { id: 1, titel: "Silent Lines", jahr: 2015, artistId: 1 } ]
Neuestes Album: Silent Lines ( 2015 )
Tracks pro Album: [ { titel: "Silent Lines", tracks: 2 } ]
HÜ 1, Ältestes Album SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
HÜ 1, Ältestes Album: Night Ferry ( 2012 )
HÜ 2, Tracks mit 'Echo%' SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where ("track"."album_id" = ? and "track"."titel" like ?)
HÜ 2, Parameter: [ 1, "Echo%" ]
HÜ 2, Tracks mit 'Echo%': [ "Echo Room" ]
HÜ 3, Anzahl Tracks je Album SQL: select "track"."album_id", "album"."titel", count() as "trackAnzahl" from "track" inner join "album" on "track"."album_id" = "album"."id" group by "track"."album_id", "album"."titel"
HÜ 3, Anzahl Tracks je Album: [ { albumId: 1, titel: "Silent Lines", trackAnzahl: 2 } ]
Nach update: 220 Sekunden
Tracks nach delete: 1
```

### Testergebnisse (`deno task test`):
```text
running 12 tests from ./demo_test.ts
insert mit returning liefert die neue Zeile mit id ... ok (2ms)
select mit where filtert typsicher ... ok (1ms)
Fremdschlüssel verhindert Album ohne Artist ... ok (1ms)
update aendert nur die gewaehlten Zeilen ... ok (2ms)
delete entfernt nur die gewaehlte Zeile ... ok (1ms)
orderBy + limit liefern das juengste Album ... ok (1ms)
HÜ: orderBy + limit liefern das aelteste Album ... ok (1ms)
HÜ: and + eq + like filtern Tracks nach Album und Titel-Anfang 'Echo' ... ok (2ms)
HÜ: count + groupBy zaehlen Tracks je Album ... ok (2ms)
innerJoin verbindet Album und Artist ... ok (1ms)
Drizzle parametrisiert: Werte stecken in params, nicht im SQL ... ok (1ms)
assertThrows ist importiert und steht bereit ... ok (0ms)

ok | 12 passed | 0 failed (15ms)
```
