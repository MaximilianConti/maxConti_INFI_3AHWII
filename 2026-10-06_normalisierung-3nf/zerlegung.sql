-- zerlegung.sql — die 3NF-Zerlegungen aus 3nf-loesung.md als lauffähiges Skript.

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