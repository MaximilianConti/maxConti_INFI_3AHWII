# Nachweis der Query-Ausführung gegen die SQLite-Datenbank

**Fach:** INFI · **Aufgabe:** Rep ohne Node (2026-09-29)  
**Datenbank:** `musik-mini.db` (erzeugt via `seed-musik-mini.sql`)  
**Datum:** 2026-10-06 / Nachtrag 2026-11-02

Dieser Nachweis belegt die fehlerfreie Ausführung der fünf Auffrischungs-Queries aus `auffrischung.sql` direkt gegen die SQLite-Datenbank `musik-mini.db`.

---

## 1. Initialisierung / Seed

```console
$ sqlite3 musik-mini.db < seed-musik-mini.sql
$ sqlite3 musik-mini.db "SELECT COUNT(*) AS tabellen FROM sqlite_master WHERE type='table';"
tabellen
3
```

---

## 2. Ausführung der 5 Queries (`sqlite3 musik-mini.db`)

### Query 1: Top-Künstler nach Track-Anzahl
> **Absicht:** Welche 5 Künstler haben die meisten Songs? (JOIN + GROUP BY + ORDER + LIMIT)

```sql
sqlite> .mode column
sqlite> .headers on
sqlite> SELECT k.name, COUNT(*) AS tracks
   ...> FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
   ...> GROUP BY k.id
   ...> ORDER BY tracks DESC
   ...> LIMIT 5;
name   tracks
-----  ------
Auer   3     
Frei   2     
Demir  2     
Egger  1     
Cevik  1     
```

### Query 2: Künstlerpaare desselben Labels
> **Absicht:** Welche Künstler teilen sich ein Label? (Self-JOIN mit `x.id < y.id` gegen Doppelpaare/Spiegelungen)

```sql
sqlite> SELECT x.name AS a, y.name AS b, l.name AS label
   ...> FROM kuenstler x
   ...> JOIN kuenstler y ON x.label_id = y.label_id AND x.id < y.id
   ...> JOIN label l ON l.id = x.label_id;
a      b      label      
-----  -----  -----------
Auer   Beck   Nordklang  
Cevik  Demir  Suedton    
Cevik  Egger  Suedton    
Demir  Egger  Suedton    
```

### Query 3: Labels mit mehr als einem Künstler
> **Absicht:** Welche Labels haben mehr als einen Künstler unter Vertrag? (`HAVING` filtert aggregierte Gruppen)

```sql
sqlite> SELECT l.name, COUNT(*) AS n
   ...> FROM kuenstler k JOIN label l ON l.id = k.label_id
   ...> GROUP BY l.id
   ...> HAVING COUNT(*) > 1;
name        n
----------  -
Nordklang   2
Suedton     3
```

### Query 4: `COUNT(*)` vs. `COUNT(label_id)`
> **Absicht:** Wie viele Künstler gibt es insgesamt, wie viele haben ein Label? (Demonstration der NULL-Semantik bei Aggregaten)

```sql
sqlite> SELECT COUNT(*) AS alle, COUNT(label_id) AS mit_label FROM kuenstler;
alle  mit_label
----  ---------
6     5        
```
*Beobachtung:* Der Künstler ohne Label (`label_id IS NULL`) wird bei `COUNT(*)` mitgezählt, bei `COUNT(label_id)` ignoriert.

### Query 5: WHERE + HAVING kombiniert
> **Absicht:** Welche Künstler haben mindestens 2 Songs, die länger als 200 Sekunden dauern?

```sql
sqlite> SELECT k.name, COUNT(*) AS n
   ...> FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
   ...> WHERE s.dauer_sek > 200
   ...> GROUP BY k.id
   ...> HAVING COUNT(*) >= 2;
name  n
----  -
Auer  2
```

---

## 3. Deno-Testnachweis (`deno test`)

```console
$ deno test
running 3 tests from ./main_test.ts
Top-Kuenstler Query liefert Auer mit 3 Tracks ... ok (2ms)
Kuenstlerpaare desselben Labels liefert 4 Paare ... ok (1ms)
COUNT(*) vs COUNT(label_id) zeigt NULL-Semantik (6 vs 5) ... ok (1ms)

ok | 3 passed | 0 failed (12ms)
```
