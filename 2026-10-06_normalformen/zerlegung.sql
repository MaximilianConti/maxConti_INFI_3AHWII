-- zerlegung.sql — die Zerlegungen aus loesung.md als lauffähiges SQLite-Skript.
-- Ausführen:  sqlite3 normalformen.db < zerlegung.sql
-- Reines SQLite (ohne ORM) — die Prisma-Variante liegt in praxis/.

---------------------------------------------------------------------
-- 1NF — atomare Werte: eine Zeile pro Wert
---------------------------------------------------------------------
-- Quelle: kunde_hobby_denorm(kunde_id, name, hobbys) — "Lesen, Schwimmen" in einer Zelle.

DROP TABLE IF EXISTS hobby;
CREATE TABLE hobby(
  kunde_id INTEGER NOT NULL,
  hobby    TEXT NOT NULL,
  PRIMARY KEY(kunde_id, hobby)
);
INSERT INTO hobby(kunde_id, hobby) VALUES
  (1, 'Lesen'),
  (1, 'Schwimmen'),
  (2, 'Schach');

-- Quelle: bestellung_repeat(bestell_nr, kunde, track1, track2, track3) — Wiederholgruppe.

DROP TABLE IF EXISTS bestellposition;
CREATE TABLE bestellposition(
  bestell_nr INTEGER NOT NULL,
  position   INTEGER NOT NULL,
  track_id   INTEGER NOT NULL,
  PRIMARY KEY(bestell_nr, position)
);
INSERT INTO bestellposition(bestell_nr, position, track_id) VALUES
  (101, 1, 1),
  (101, 2, 2),
  (102, 1, 3);

---------------------------------------------------------------------
-- 2NF — partielle Abhängigkeit: Entität auslagern
---------------------------------------------------------------------
-- Quelle: song_playlist_denorm(song_id, playlist_id, song_titel), PK (song_id, playlist_id).
-- song_titel hängt nur an song_id, nicht am ganzen Schlüssel.

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

-- Die Zwischentabelle hält nur noch die Beziehung — keine Fakten mehr.
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

-- Quelle: bestellposition_prod_denorm(bestell_nr, produkt_nr, menge, produkt_name),
--         PK (bestell_nr, produkt_nr) — produkt_name hängt nur an produkt_nr.

DROP TABLE IF EXISTS produkt;
CREATE TABLE produkt(
  produkt_nr INTEGER PRIMARY KEY,
  name       TEXT NOT NULL
);
INSERT INTO produkt(produkt_nr, name) VALUES
  (1, 'Kabel'),
  (2, 'Stecker'),
  (3, 'Adapter');

DROP TABLE IF EXISTS bestellposition_prod;
CREATE TABLE bestellposition_prod(
  bestell_nr INTEGER NOT NULL,
  produkt_nr INTEGER NOT NULL REFERENCES produkt(produkt_nr),
  menge      INTEGER NOT NULL,
  PRIMARY KEY(bestell_nr, produkt_nr)
);
INSERT INTO bestellposition_prod(bestell_nr, produkt_nr, menge) VALUES
  (101, 1, 2),
  (101, 2, 1),
  (102, 1, 5);

-- 2NF hält bereits: die Note braucht beide Schlüsselteile (wer, welche LV).
DROP TABLE IF EXISTS pruefung;
CREATE TABLE pruefung(
  matr_nr INTEGER NOT NULL,
  lv_nr   TEXT NOT NULL,
  note    INTEGER NOT NULL,
  PRIMARY KEY(matr_nr, lv_nr)
);
INSERT INTO pruefung(matr_nr, lv_nr, note) VALUES
  (1, 'DBI', 1),
  (1, 'SWP', 2),
  (2, 'DBI', 3);

---------------------------------------------------------------------
-- 3NF — transitive Abhängigkeit: Faktentabelle auslagern
---------------------------------------------------------------------
-- Quelle: bestellung_denorm(bestell_nr, kunde, plz, ort) — ort hängt an plz.

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

-- SWP-Crossover: konto_denorm(iban, inhaber, blz, bankname) — bankname hängt an blz.

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

-- SWP-Crossover: person_denorm(svnr, name, plz, ort) — ort hängt an plz.

DROP TABLE IF EXISTS person;
CREATE TABLE person(
  svnr TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plz  TEXT NOT NULL REFERENCES plz(plz)
);
INSERT INTO person(svnr, name, plz) VALUES
  ('1001', 'Auer',  '1020'),
  ('1002', 'Beck',  '1020'),
  ('1003', 'Cevik', '4020');
