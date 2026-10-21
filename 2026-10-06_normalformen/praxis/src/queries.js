// src/queries.js — die Zerlegungen aus ../loesung.md als Prisma-Abfragen.
// Leitidee: die Anomalie-Kontrolle läuft über _count und groupBy (Prisma-API),
// nicht über rohes SQL. Nur die Self-JOIN-Frage nutzt $queryRaw.
import { pathToFileURL } from "node:url";
import { prisma } from "./prisma.js";

// 1) 3NF-Kontrolle: Hat eine PLZ mehr als einen Ort?
//    Nach der Zerlegung ist das unmöglich — jede PLZ steht genau einmal in `plz`.
export async function orteProPlz() {
  const gruppen = await prisma.plz.groupBy({
    by: ["plz"],
    _count: { _all: true },
  });
  return gruppen.map((g) => ({ plz: g.plz, anzahlOrte: g._count._all }));
}

// 2) Bestellungen inkl. Ort — der Join über die FK plzRef zeigt,
//    dass der Ort jetzt aus der PLZ-Tabelle kommt und nicht doppelt gespeichert ist.
export async function bestellungenMitOrt() {
  const bestellungen = await prisma.bestellung.findMany({
    include: { plzRef: true },
    orderBy: { bestellNr: "asc" },
  });
  return bestellungen.map((b) => ({
    bestellNr: b.bestellNr,
    kunde: b.kunde,
    plz: b.plz,
    ort: b.plzRef.ort,
  }));
}

// 3) Interleaving: die ursprüngliche Bestellung inkl. ihrer Track-Titel.
//    Aus bestellung + bestellposition + song wieder zusammengesetzt.
export async function bestellungMitTrackTiteln(bestellNr = 101) {
  const bestellung = await prisma.bestellung.findUnique({
    where: { bestellNr },
    include: {
      plzRef: true,
      positionen: {
        include: { track: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!bestellung) return null;
  return {
    bestellNr: bestellung.bestellNr,
    kunde: bestellung.kunde,
    ort: bestellung.plzRef.ort,
    tracks: bestellung.positionen.map((p) => p.track.titel),
  };
}

// 4) 2NF-Kontrolle: Songs pro Playlist (über die Zwischentabelle).
export async function songsProPlaylist() {
  const playlists = await prisma.playlist.findMany({
    include: { _count: { select: { songs: true } } },
    orderBy: { playlistId: "asc" },
  });
  return playlists.map((p) => ({ name: p.name, anzahl: p._count.songs }));
}

// 5) 1NF-Kontrolle: Hobbys je Kunde (eine Zeile pro Wert).
export async function hobbysProKunde() {
  const kunden = await prisma.kunde.findMany({
    include: { hobbies: true },
    orderBy: { kundeId: "asc" },
  });
  return kunden.map((k) => ({
    name: k.name,
    hobbys: k.hobbies.map((h) => h.hobby).sort(),
  }));
}

// 6) 2NF-Kontrolle: Produktpositionen ohne den Produktnamen in der Faktenzeile.
export async function produktpositionen() {
  const positionen = await prisma.bestellpositionProd.findMany({
    include: { produkt: true },
    orderBy: [{ bestellNr: "asc" }, { produktNr: "asc" }],
  });
  return positionen.map((p) => ({
    bestellNr: p.bestellNr,
    produkt: p.produkt.name,
    menge: p.menge,
  }));
}

// 7) SWP-Crossover 3NF: Konten inkl. Bankname über die FK blzRef.
export async function kontenMitBank() {
  const konten = await prisma.konto.findMany({
    include: { blzRef: true },
    orderBy: { iban: "asc" },
  });
  return konten.map((k) => ({
    iban: k.iban,
    inhaber: k.inhaber,
    bankname: k.blzRef.bankname,
  }));
}

// 8) Wie viele Konten teilen sich dieselbe Bank? (Nachweis: Bankname steht genau einmal)
//    groupBy zählt hier über die Konto-Tabelle — im groupBy sind Relations-Counts
//    nicht erlaubt, deshalb wird die FK blz gruppiert.
export async function kontenProBank() {
  const gruppen = await prisma.konto.groupBy({
    by: ["blz"],
    _count: { _all: true },
  });
  return gruppen.map((g) => ({ blz: g.blz, anzahlKonten: g._count._all }));
}

async function main() {
  console.log("1) Orte pro PLZ (3NF):     ", await orteProPlz());
  console.log("2) Bestellungen mit Ort:   ", await bestellungenMitOrt());
  console.log("3) Bestellung 101 + Tracks: ", await bestellungMitTrackTiteln(101));
  console.log("4) Songs pro Playlist:     ", await songsProPlaylist());
  console.log("5) Hobbys pro Kunde (1NF): ", await hobbysProKunde());
  console.log("6) Produktpositionen:      ", await produktpositionen());
  console.log("7) Konten mit Bank:        ", await kontenMitBank());
  console.log("8) Konten pro BLZ:         ", await kontenProBank());
}

// Nur ausführen, wenn direkt gestartet (nicht beim Import im Test).
// pathToFileURL statt `file://${process.argv[1]}`: unter Windows liefert
// process.argv[1] einen Backslash-Pfad, der Vergleich wäre nie wahr.
const istDirektstart = process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (istDirektstart) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
