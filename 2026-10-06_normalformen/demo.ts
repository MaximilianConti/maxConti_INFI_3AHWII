// demo.ts — Normalisierungs-Anomalien zum Anfassen (1NF, 2NF, 3NF).
// Nur Deno + node:sqlite, kein Node, kein npm:, kein node_modules.
// Beinhaltet sowohl die Lesson-Tabellen als auch die beiden eigenen HÜ-Tabellen.
// Laufen mit:  deno task demo
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");

// =====================================================================
// 1. LESSON-BEISPIELE
// =====================================================================

// --- 1NF: Liste in einer Zelle -------------------------------------
db.exec(
  `CREATE TABLE kunde_hobby_denorm(kunde_id INTEGER PRIMARY KEY, name TEXT, hobbys TEXT)`,
);
db.prepare(`INSERT INTO kunde_hobby_denorm VALUES (?, ?, ?)`)
  .run(1, "Auer", "Lesen, Schwimmen");

const treffer = db.prepare(
  `SELECT COUNT(*) AS n FROM kunde_hobby_denorm WHERE hobbys = 'Schwimmen'`,
).get() as { n: number };
console.log(
  `1NF: WHERE hobbys = 'Schwimmen' findet ${treffer.n} Zeilen (die Zelle ist eine Liste).`,
);

// 1NF-Fix: eine Zeile pro Wert.
db.exec(
  `CREATE TABLE hobby(kunde_id INTEGER, hobby TEXT, PRIMARY KEY(kunde_id, hobby))`,
);
db.prepare(`INSERT INTO hobby VALUES (?, ?)`).run(1, "Lesen");
db.prepare(`INSERT INTO hobby VALUES (?, ?)`).run(1, "Schwimmen");
const trefferFix = db.prepare(
  `SELECT COUNT(*) AS n FROM hobby WHERE hobby = 'Schwimmen'`,
).get() as { n: number };
console.log(`1NF-Fix: eine Zeile pro Wert -> ${trefferFix.n} Treffer.`);

// --- 2NF: partielle Abhängigkeit -----------------------------------
db.exec(
  `CREATE TABLE song_playlist_denorm(song_id INTEGER, playlist_id INTEGER, song_titel TEXT, PRIMARY KEY(song_id, playlist_id))`,
);
const insert = db.prepare(
  `INSERT INTO song_playlist_denorm VALUES (?, ?, ?)`,
);
insert.run(1, 10, "Silent Lines");
insert.run(1, 20, "Silent Lines");
db.prepare(
  `UPDATE song_playlist_denorm SET song_titel = ? WHERE song_id = 1 AND playlist_id = 10`,
).run("Silent Lines (neu)");

const titel = db.prepare(
  `SELECT COUNT(DISTINCT song_titel) AS n FROM song_playlist_denorm WHERE song_id = 1`,
).get() as { n: number };
console.log(
  `2NF: song_id 1 hat ${titel.n} verschiedene Titel (Titel hängt nur an song_id).`,
);

// 2NF-Fix: der Titel steht in der Song-Tabelle, genau einmal.
db.exec(`CREATE TABLE song(song_id INTEGER PRIMARY KEY, titel TEXT)`);
db.prepare(`INSERT INTO song VALUES (?, ?)`).run(1, "Silent Lines");
const titelFix = db.prepare(
  `SELECT COUNT(*) AS n FROM song WHERE song_id = 1`,
).get() as { n: number };
console.log(
  `2NF-Fix: der Titel steht ${titelFix.n} Mal fuer song_id 1.`,
);

// --- 3NF: transitive Abhängigkeit ----------------------------------
db.exec(
  `CREATE TABLE bestellung_denorm(bestell_nr INTEGER PRIMARY KEY, plz TEXT, ort TEXT)`,
);
db.prepare(`INSERT INTO bestellung_denorm VALUES (?, ?, ?)`).run(
  101,
  "1020",
  "Wien",
);
db.prepare(`INSERT INTO bestellung_denorm VALUES (?, ?, ?)`).run(
  102,
  "1020",
  "Wien",
);
db.prepare(
  `UPDATE bestellung_denorm SET ort = ? WHERE bestell_nr = 101`,
).run("Wien (neu)");

const orte = db.prepare(
  `SELECT COUNT(DISTINCT ort) AS n FROM bestellung_denorm WHERE plz = '1020'`,
).get() as { n: number };
console.log(
  `3NF: PLZ 1020 hat ${orte.n} verschiedene Orte (Ort hängt an PLZ).`,
);

// 3NF-Fix: Faktentabelle plz
db.exec(`CREATE TABLE plz(plz TEXT PRIMARY KEY, ort TEXT)`);
db.prepare(`INSERT INTO plz VALUES (?, ?)`).run("1020", "Wien");
const plzFix = db.prepare(`SELECT COUNT(*) AS n FROM plz WHERE plz = '1020'`)
  .get() as { n: number };
console.log(`3NF-Fix: PLZ 1020 steht ${plzFix.n} Mal in Tabelle plz.`);

// =====================================================================
// 2. EIGENE HÜ-TABELLEN (aus zerlegung.sql & loesung.md)
// =====================================================================

// --- Eigene Tabelle 1: 2NF (bestellposition_prod_denorm) -------------
db.exec(
  `CREATE TABLE bestellposition_prod_denorm(bestell_nr INTEGER, produkt_id INTEGER, anzahl INTEGER, produkt_name TEXT, PRIMARY KEY(bestell_nr, produkt_id))`,
);
db.prepare(`INSERT INTO bestellposition_prod_denorm VALUES (?, ?, ?, ?)`)
  .run(1001, 42, 2, "Kopfhörer Pro");
db.prepare(`INSERT INTO bestellposition_prod_denorm VALUES (?, ?, ?, ?)`)
  .run(1002, 42, 1, "Kopfhörer Pro");
// Anomalie: Name nur in einer Bestellposition aktualisiert
db.prepare(
  `UPDATE bestellposition_prod_denorm SET produkt_name = ? WHERE bestell_nr = 1001 AND produkt_id = 42`,
).run("Kopfhörer Pro 2.0");

const prodNamen = db.prepare(
  `SELECT COUNT(DISTINCT produkt_name) AS n FROM bestellposition_prod_denorm WHERE produkt_id = 42`,
).get() as { n: number };
console.log(
  `2NF (eigene Tabelle bestellposition): produkt_id 42 hat ${prodNamen.n} verschiedene Produktnamen (partielle Abhängigkeit).`,
);

// 2NF-Fix: Auslagern in Tabelle produkt
db.exec(
  `CREATE TABLE produkt(produkt_id INTEGER PRIMARY KEY, produkt_name TEXT, preis_cent INTEGER)`,
);
db.prepare(`INSERT INTO produkt VALUES (?, ?, ?)`).run(42, "Kopfhörer Pro", 8990);
const prodFix = db.prepare(
  `SELECT COUNT(*) AS n FROM produkt WHERE produkt_id = 42`,
).get() as { n: number };
console.log(`2NF-Fix: produkt_id 42 steht ${prodFix.n} Mal in Tabelle produkt.`);

// --- Eigene Tabelle 2: 3NF (konto_denorm — SWP-Crossover) -----------
db.exec(
  `CREATE TABLE konto_denorm(iban TEXT PRIMARY KEY, inhaber TEXT, blz TEXT, bankname TEXT)`,
);
db.prepare(`INSERT INTO konto_denorm VALUES (?, ?, ?, ?)`).run(
  "AT01",
  "Auer",
  "1000",
  "Erste Bank",
);
db.prepare(`INSERT INTO konto_denorm VALUES (?, ?, ?, ?)`).run(
  "AT02",
  "Beck",
  "1000",
  "Erste Bank",
);
// Anomalie: Bankname nur bei einem Konto geändert
db.prepare(
  `UPDATE konto_denorm SET bankname = ? WHERE iban = 'AT01'`,
).run("Erste Group Bank");

const banken = db.prepare(
  `SELECT COUNT(DISTINCT bankname) AS n FROM konto_denorm WHERE blz = '1000'`,
).get() as { n: number };
console.log(
  `3NF (eigene Tabelle konto_denorm): BLZ 1000 hat ${banken.n} verschiedene Banknamen (transitive Abhängigkeit).`,
);

// 3NF-Fix: Auslagern in Tabelle blz
db.exec(`CREATE TABLE blz(blz TEXT PRIMARY KEY, bankname TEXT)`);
db.prepare(`INSERT INTO blz VALUES (?, ?)`).run("1000", "Erste Bank");
const blzEigeneFix = db.prepare(
  `SELECT COUNT(*) AS n FROM blz WHERE blz = '1000'`,
).get() as { n: number };
console.log(`3NF-Fix: BLZ 1000 steht ${blzEigeneFix.n} Mal in Tabelle blz.`);

db.close();
