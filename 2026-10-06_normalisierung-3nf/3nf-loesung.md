# 3NF-Zerlegung — HÜ 2026-10-06 (Dritte Normalform)

Kriterium 3NF: keine transitiven Abhängigkeiten — jede Nicht-Schlüssel-Tatsache
hängt nur vom Schlüssel ab („ganzer Schlüssel, nichts als der Schlüssel").

## 1. `bestellung_denorm` bis 3NF zerlegen

Ausgangstabelle `bestellung_denorm(bestell_nr, kunde, plz, ort)`:

- Schlüssel: `bestell_nr`.
- **Transitive Kette:** `bestell_nr → plz → ort`. Der Ort ist eine Tatsache
  über die PLZ, nicht über die Bestellung. In der Tabelle steht z. B. Wien
  doppelt (Zeile 101 + 102), was zu Änderungs-Anomalien führt (eine Zeile wird
  geändert, die andere nicht).

Zerlegung in zwei Tabellen:

```
bestellung(bestell_nr, kunde, plz)          plz(plz, ort)
```

- `bestellung` behält Schlüssel `bestell_nr`, `kunde` und nur die `plz`
  (Fremdschlüssel auf `plz`).
- `plz` macht aus der transitiven Kette eine direkte Eigenschaft: `plz → ort`,
  `ort` hängt voll vom Schlüssel `plz` ab.
- Jede Tatsache steht jetzt genau einmal → keine Anomalien mehr.

```sql
DROP TABLE IF EXISTS plz;
CREATE TABLE plz(
  plz TEXT PRIMARY KEY,
  ort TEXT NOT NULL
);
INSERT INTO plz(plz, ort) VALUES ('1020', 'Wien'), ('4020', 'Linz');

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

## 2. Zwei Quiz-Tabellen zerlegen (CREATEs + je 3 Zeilen)

### 2a. `schueler_denorm` (Quiz 2: Klasse → Sprecher transitiv)

Ausgangstabelle `schueler_denorm(matr_nr, name, klasse, klassensprecher)`:

- Schlüssel: `matr_nr`.
- **Transitive Kette:** `matr_nr → klasse → klassensprecher`. Der
  Klassensprecher ist eine Tatsache über die Klasse, nicht über den Schüler.
- Zerlegung in `schueler(matr_nr, name, klasse)` + `klasse(klasse,
  klassensprecher)` — der Sprecher hängt jetzt direkt von `klasse` ab.

```sql
DROP TABLE IF EXISTS klasse;
CREATE TABLE klasse(
  klasse          TEXT PRIMARY KEY,
  klassensprecher TEXT NOT NULL
);
INSERT INTO klasse(klasse, klassensprecher) VALUES
  ('3AHWII', 'Beck'),
  ('3BHWII', 'Demir');

DROP TABLE IF EXISTS schueler;
CREATE TABLE schueler(
  matr_nr INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  klasse  TEXT NOT NULL REFERENCES klasse(klasse)
);
INSERT INTO schueler(matr_nr, name, klasse) VALUES
  (1, 'Auer',  '3AHWII'),
  (2, 'Beck',  '3AHWII'),
  (3, 'Cevik', '3BHWII');
```

### 2b. `album_denorm` (Quiz 3: Label-Adresse transitiv)

Ausgangstabelle `album_denorm(album_id, titel, label, label_adresse)`:

- Schlüssel: `album_id`.
- **Transitive Kette:** `album_id → label → label_adresse`. Die Adresse ist eine
  Tatsache über das Label, nicht über das Album. Kommt ein neues Album desselben
  Labels hinzu, müsste die Adresse wiederholt werden.
- Zerlegung in `album(album_id, titel, label)` + `label(label, label_adresse)`.

```sql
DROP TABLE IF EXISTS label;
CREATE TABLE label(
  label         TEXT PRIMARY KEY,
  label_adresse TEXT NOT NULL
);
INSERT INTO label(label, label_adresse) VALUES
  ('Nordklang', 'Hafenstr. 4, Hamburg'),
  ('Suedton',   'Ringstr. 9, Graz');

DROP TABLE IF EXISTS album;
CREATE TABLE album(
  album_id INTEGER PRIMARY KEY,
  titel    TEXT NOT NULL,
  label    TEXT NOT NULL REFERENCES label(label)
);
INSERT INTO album(album_id, titel, label) VALUES
  (1, 'Silent Lines', 'Nordklang'),
  (2, 'Night Ferry',  'Nordklang'),
  (3, 'Dust Choir',   'Suedton');
```

## Nachweis

`sqlite3 3nf-hue.db < zerlegung.sql` funktioniert — Ergebnis: drei Tabellenpaare,
jede Tatsache genau einmal.