// demo_test.ts — Tests zu den Normalisierungs-Anomalien (Deno, ohne Node).
// Prüft Lesson-Tabellen und die beiden eigenen HÜ-Tabellen.
// Laufen mit:  deno task test
import { assertEquals } from "@std/assert";
import { DatabaseSync } from "node:sqlite";

Deno.test("1NF: Liste in der Zelle bricht die Gleichheitssuche", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE kunde_hobby_denorm(kunde_id INTEGER PRIMARY KEY, hobbys TEXT)`,
  );
  db.prepare(`INSERT INTO kunde_hobby_denorm VALUES (?, ?)`)
    .run(1, "Lesen, Schwimmen");
  const row = db.prepare(
    `SELECT COUNT(*) AS n FROM kunde_hobby_denorm WHERE hobbys = 'Schwimmen'`,
  ).get() as { n: number };
  assertEquals(row.n, 0); // die Zelle ist "Lesen, Schwimmen", nicht "Schwimmen"
  db.close();
});

Deno.test("2NF: partielle Abhängigkeit erlaubt widersprüchliche Titel", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE sp(song_id INTEGER, playlist_id INTEGER, song_titel TEXT, PRIMARY KEY(song_id, playlist_id))`,
  );
  db.prepare(`INSERT INTO sp VALUES (?, ?, ?)`).run(1, 10, "Silent Lines");
  db.prepare(`INSERT INTO sp VALUES (?, ?, ?)`).run(
    1,
    20,
    "Silent Lines (neu)",
  );
  const row = db.prepare(
    `SELECT COUNT(DISTINCT song_titel) AS n FROM sp WHERE song_id = 1`,
  ).get() as { n: number };
  assertEquals(row.n, 2);
  db.close();
});

Deno.test("3NF: transitive Abhängigkeit erlaubt widersprüchliche Orte", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE b(bestell_nr INTEGER PRIMARY KEY, plz TEXT, ort TEXT)`);
  db.prepare(`INSERT INTO b VALUES (?, ?, ?)`).run(1, "1020", "Wien");
  db.prepare(`INSERT INTO b VALUES (?, ?, ?)`).run(2, "1020", "Wien (neu)");
  const row = db.prepare(
    `SELECT COUNT(DISTINCT ort) AS n FROM b WHERE plz = '1020'`,
  ).get() as { n: number };
  assertEquals(row.n, 2);
  db.close();
});

Deno.test("3NF-Fix: PLZ -> Ort steht genau einmal", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE plz(plz TEXT PRIMARY KEY, ort TEXT)`);
  db.prepare(`INSERT INTO plz VALUES (?, ?)`).run("1020", "Wien");
  const row = db.prepare(
    `SELECT COUNT(*) AS n FROM plz WHERE plz = '1020'`,
  ).get() as { n: number };
  assertEquals(row.n, 1);
  db.close();
});

// Eigene HÜ-Tabelle 1: 2NF (bestellposition_prod_denorm)
Deno.test("2NF (eigene HÜ-Tabelle): partielle Abhängigkeit erzeugt 2 Produktnamen", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE bp(bestell_nr INTEGER, produkt_id INTEGER, produkt_name TEXT, PRIMARY KEY(bestell_nr, produkt_id))`,
  );
  db.prepare(`INSERT INTO bp VALUES (?, ?, ?)`).run(1001, 42, "Kopfhörer Pro");
  db.prepare(`INSERT INTO bp VALUES (?, ?, ?)`).run(1002, 42, "Kopfhörer Pro (neu)");
  const row = db.prepare(
    `SELECT COUNT(DISTINCT produkt_name) AS n FROM bp WHERE produkt_id = 42`,
  ).get() as { n: number };
  assertEquals(row.n, 2);

  // Fix: produkt-Tabelle
  db.exec(`CREATE TABLE produkt(produkt_id INTEGER PRIMARY KEY, produkt_name TEXT)`);
  db.prepare(`INSERT INTO produkt VALUES (?, ?)`).run(42, "Kopfhörer Pro");
  const fix = db.prepare(`SELECT COUNT(*) AS n FROM produkt WHERE produkt_id = 42`).get() as { n: number };
  assertEquals(fix.n, 1);
  db.close();
});

// Eigene HÜ-Tabelle 2: 3NF (konto_denorm — SWP-Crossover)
Deno.test("3NF (eigene HÜ-Tabelle): transitive Kette erzeugt 2 Banknamen fuer dieselbe BLZ", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE kd(iban TEXT PRIMARY KEY, blz TEXT, bankname TEXT)`,
  );
  db.prepare(`INSERT INTO kd VALUES (?, ?, ?)`).run("AT01", "1000", "Erste Bank");
  db.prepare(`INSERT INTO kd VALUES (?, ?, ?)`).run("AT02", "1000", "Erste Bank neu");
  const row = db.prepare(
    `SELECT COUNT(DISTINCT bankname) AS n FROM kd WHERE blz = '1000'`,
  ).get() as { n: number };
  assertEquals(row.n, 2);

  // Fix: blz-Tabelle
  db.exec(`CREATE TABLE blz(blz TEXT PRIMARY KEY, bankname TEXT)`);
  db.prepare(`INSERT INTO blz VALUES (?, ?)`).run("1000", "Erste Bank");
  const fix = db.prepare(`SELECT COUNT(*) AS n FROM blz WHERE blz = '1000'`).get() as { n: number };
  assertEquals(fix.n, 1);
  db.close();
});
