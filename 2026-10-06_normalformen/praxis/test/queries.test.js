// test/queries.test.js — node:test (eingebaut, keine Zusatz-Abhängigkeit).
// Voraussetzung: npm run db:seed (nutzt dev.db).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/prisma.js";
import {
  bestellungMitTrackTiteln,
  bestellungenMitOrt,
  hobbysProKunde,
  orteProPlz,
  produktpositionen,
  kontenMitBank,
  kontenProBank,
  songsProPlaylist,
} from "../src/queries.js";

before(async () => {
  assert.ok(
    (await prisma.bestellung.count()) > 0,
    "Bitte zuerst `npm run db:seed` ausführen.",
  );
});

after(async () => {
  await prisma.$disconnect();
});

test("3NF: jede PLZ hat genau einen Ort (keine transitiven Doppelungen)", async () => {
  const orte = await orteProPlz();
  assert.equal(orte.length, 3);
  assert.ok(
    orte.every((o) => o.anzahlOrte === 1),
    "Eine PLZ darf nie mehr als einen Ort haben.",
  );
});

test("3NF: PLZ 1020 liefert genau einen Ort", async () => {
  const orte = await orteProPlz();
  const wien = orte.find((o) => o.plz === "1020");
  assert.equal(wien.anzahlOrte, 1);
});

test("3NF: Bestellungen holen ihren Ort über die FK aus der PLZ-Tabelle", async () => {
  const bestellungen = await bestellungenMitOrt();
  assert.equal(bestellungen.length, 3);
  const a = bestellungen.find((b) => b.bestellNr === 101);
  assert.equal(a.ort, "Wien");
  assert.equal(a.plz, "1020");
});

test("Interleaving: Bestellung 101 kommt mit ihren Track-Titeln zurück", async () => {
  const b = await bestellungMitTrackTiteln(101);
  assert.equal(b.kunde, "Auer");
  assert.equal(b.ort, "Wien");
  assert.deepEqual(b.tracks, ["Silent Lines", "Night Ferry"]);
});

test("1NF: Kunde Auer hat zwei Hobbys, je eine Zeile", async () => {
  const kunden = await hobbysProKunde();
  const auer = kunden.find((k) => k.name === "Auer");
  assert.deepEqual(auer.hobbys, ["Lesen", "Schwimmen"]);
  const schach = kunden.find((k) => k.name === "Beck");
  assert.deepEqual(schach.hobbys, ["Schach"]);
});

test("2NF: Song 1 liegt in 2 Playlists (N:M über die Zwischentabelle)", async () => {
  const pro = await songsProPlaylist();
  assert.deepEqual(pro, [
    { name: "Fokus", anzahl: 1 },
    { name: "Nachtfahrt", anzahl: 2 },
  ]);
});

test("2NF: Produktname steht genau einmal (in der Produkt-Tabelle)", async () => {
  const positionen = await produktpositionen();
  assert.equal(positionen.length, 3);
  const kabel = positionen.filter((p) => p.produkt === "Kabel");
  assert.equal(kabel.length, 2);
});

test("3NF SWP-Crossover: zwei Konten teilen sich eine Bank", async () => {
  const konten = await kontenMitBank();
  const erste = konten.filter((k) => k.bankname === "Erste Bank");
  assert.equal(erste.length, 2);
  const proBank = await kontenProBank();
  const e = proBank.find((b) => b.blz === "1000");
  assert.equal(e.anzahlKonten, 2);
});
