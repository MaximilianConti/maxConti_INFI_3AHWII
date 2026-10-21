// src/seed.js — die normalisierten Tabellen aus ../zerlegung.sql als Prisma-Seed.
// Reihenfolge wegen Fremdschlüsseln: Eltern zuerst, Kinder danach.
import { prisma } from "./prisma.js";

async function main() {
  // --- 1NF ---
  await prisma.hobby.deleteMany();
  await prisma.kunde.deleteMany();

  // --- 3NF ---
  await prisma.bestellposition.deleteMany();
  await prisma.bestellpositionProd.deleteMany();
  await prisma.bestellung.deleteMany();
  await prisma.plz.deleteMany();

  // --- 2NF (Song/Playlist) ---
  await prisma.songPlaylist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.playlist.deleteMany();

  // --- 2NF (Produkt) ---
  await prisma.produkt.deleteMany();

  // --- 2NF hält bereits ---
  await prisma.pruefung.deleteMany();

  // --- SWP-Crossover 3NF ---
  await prisma.konto.deleteMany();
  await prisma.blz.deleteMany();
  await prisma.person.deleteMany();

  // --- 1NF: Kunden + Hobbys (je Zeile ein Wert) ---
  await prisma.kunde.createMany({
    data: [
      { name: "Auer" },
      { name: "Beck" },
      { name: "Cevik" },
    ],
  });
  const kunde = await prisma.kunde.findMany({ orderBy: { kundeId: "asc" } });
  await prisma.hobby.createMany({
    data: [
      { kundeId: kunde[0].kundeId, hobby: "Lesen" },
      { kundeId: kunde[0].kundeId, hobby: "Schwimmen" },
      { kundeId: kunde[1].kundeId, hobby: "Schach" },
    ],
  });

  // --- 3NF: PLZ-Orts-Tabelle (Orte genau einmal) ---
  await prisma.plz.createMany({
    data: [
      { plz: "1020", ort: "Wien" },
      { plz: "4020", ort: "Linz" },
      { plz: "8010", ort: "Graz" },
    ],
  });

  // --- 2NF: Song + Playlist + Zwischentabelle ---
  await prisma.song.createMany({
    data: [
      { titel: "Silent Lines", dauerSek: 215 },
      { titel: "Night Ferry", dauerSek: 240 },
      { titel: "Dust Choir", dauerSek: 198 },
    ],
  });
  await prisma.playlist.createMany({
    data: [{ name: "Fokus" }, { name: "Nachtfahrt" }],
  });
  const songs = await prisma.song.findMany({ orderBy: { songId: "asc" } });
  const playlists = await prisma.playlist.findMany({
    orderBy: { playlistId: "asc" },
  });
  await prisma.songPlaylist.createMany({
    data: [
      { songId: songs[0].songId, playlistId: playlists[0].playlistId },
      { songId: songs[0].songId, playlistId: playlists[1].playlistId },
      { songId: songs[1].songId, playlistId: playlists[1].playlistId },
    ],
  });

  // --- 2NF: Produkt + Bestellposition ---
  await prisma.produkt.createMany({
    data: [
      { name: "Kabel" },
      { name: "Stecker" },
      { name: "Adapter" },
    ],
  });

  // --- 2NF hält bereits: Note braucht beide Schlüsselteile ---
  await prisma.pruefung.createMany({
    data: [
      { matrNr: 1, lvNr: "DBI", note: 1 },
      { matrNr: 1, lvNr: "SWP", note: 2 },
      { matrNr: 2, lvNr: "DBI", note: 3 },
    ],
  });

  // --- SWP-Crossover 3NF: BLZ + Konto ---
  await prisma.blz.createMany({
    data: [
      { blz: "1000", bankname: "Erste Bank" },
      { blz: "2000", bankname: "Oberbank" },
      { blz: "3000", bankname: "Alpenbank" },
    ],
  });
  await prisma.konto.createMany({
    data: [
      { iban: "AT01", inhaber: "Auer", blz: "1000" },
      { iban: "AT02", inhaber: "Beck", blz: "1000" },
      { iban: "AT03", inhaber: "Cevik", blz: "2000" },
    ],
  });

  // --- 3NF: Bestellung (nur noch PLZ, der Ort steckt in plz) ---
  await prisma.bestellung.createMany({
    data: [
      { bestellNr: 101, kunde: "Auer", plz: "1020" },
      { bestellNr: 102, kunde: "Beck", plz: "1020" },
      { bestellNr: 103, kunde: "Cevik", plz: "4020" },
    ],
  });

  // --- 1NF: Wiederholgruppe -> Positionen (statt track1/track2/track3) ---
  await prisma.bestellposition.createMany({
    data: [
      { bestellNr: 101, position: 1, trackId: songs[0].songId },
      { bestellNr: 101, position: 2, trackId: songs[1].songId },
      { bestellNr: 102, position: 1, trackId: songs[2].songId },
    ],
  });

  // --- 2NF: Produktpositionen (ohne produkt_name) ---
  await prisma.bestellpositionProd.createMany({
    data: [
      { bestellNr: 101, produktNr: 1, menge: 2 },
      { bestellNr: 101, produktNr: 2, menge: 1 },
      { bestellNr: 102, produktNr: 1, menge: 5 },
    ],
  });

  // --- SWP-Crossover 3NF: Person ---
  await prisma.person.createMany({
    data: [
      { svnr: "1001", name: "Auer", plz: "1020" },
      { svnr: "1002", name: "Beck", plz: "1020" },
      { svnr: "1003", name: "Cevik", plz: "4020" },
    ],
  });

  const anzahl = {
    kunde: await prisma.kunde.count(),
    plz: await prisma.plz.count(),
    bestellung: await prisma.bestellung.count(),
    song: await prisma.song.count(),
    konto: await prisma.konto.count(),
  };
  console.log(
    `Seed fertig: ${anzahl.kunde} Kunden, ${anzahl.plz} PLZ, ` +
      `${anzahl.bestellung} Bestellungen, ${anzahl.song} Songs, ${anzahl.konto} Konten.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
