// src/seed.js — Mini-Musik-DB befüllen (idempotent: erst leeren, dann neu).
import { prisma } from "./prisma.js";

async function main() {
  // Reihenfolge wegen Fremdschlüsseln: Kinder zuerst.
  await prisma.songPlaylist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.kuenstler.deleteMany();
  await prisma.label.deleteMany();

  await prisma.label.createMany({
    data: [{ name: "Ohrwurm Records" }, { name: "Indie Nord" }],
  });
  const ohrwurm = await prisma.label.findUnique({ where: { name: "Ohrwurm Records" } });
  const indie = await prisma.label.findUnique({ where: { name: "Indie Nord" } });

  await prisma.kuenstler.createMany({
    data: [
      { name: "Nova", labelId: ohrwurm.id },
      { name: "Pixel", labelId: ohrwurm.id },
      { name: "Solveig", labelId: indie.id },
      { name: "Ohne Label", labelId: null }, // für COUNT(*)-vs-COUNT(col)-Demo
    ],
  });
  const nova = await prisma.kuenstler.findFirst({ where: { name: "Nova" } });
  const pixel = await prisma.kuenstler.findFirst({ where: { name: "Pixel" } });
  const solveig = await prisma.kuenstler.findFirst({ where: { name: "Solveig" } });
  const ohne = await prisma.kuenstler.findFirst({ where: { name: "Ohne Label" } });

  await prisma.song.createMany({
    data: [
      { titel: "Nordlicht", dauerSek: 245, kuenstlerId: nova.id },
      { titel: "Glut", dauerSek: 210, kuenstlerId: nova.id },
      { titel: "Funkeln", dauerSek: 198, kuenstlerId: nova.id },
      { titel: "Pixelstaub", dauerSek: 305, kuenstlerId: pixel.id },
      { titel: "Raster", dauerSek: 233, kuenstlerId: pixel.id },
      { titel: "Fjord", dauerSek: 260, kuenstlerId: solveig.id },
      { titel: "Kurz", dauerSek: 120, kuenstlerId: ohne.id },
    ],
  });

  const songs = await prisma.song.count();
  const kuenstler = await prisma.kuenstler.count();

  // HÜ-Erweiterung: Playlists mit N:M-Beziehung zu den Songs.
  await prisma.playlist.createMany({
    data: [{ name: "Focus" }, { name: "Abend" }, { name: "Leere Liste" }],
  });
  const focus = await prisma.playlist.findFirst({ where: { name: "Focus" } });
  const abend = await prisma.playlist.findFirst({ where: { name: "Abend" } });
  const leer = await prisma.playlist.findFirst({ where: { name: "Leere Liste" } });

  const alleSongs = await prisma.song.findMany({ orderBy: { id: "asc" } });
  const songId = (titel) => alleSongs.find((s) => s.titel === titel).id;

  await prisma.songPlaylist.createMany({
    data: [
      // Focus: 2 Songs
      { songId: songId("Nordlicht"), playlistId: focus.id },
      { songId: songId("Funkeln"), playlistId: focus.id },
      // Abend: 3 Songs, davon 2 aus Focus (Überlappung -> N:M)
      { songId: songId("Nordlicht"), playlistId: abend.id },
      { songId: songId("Fjord"), playlistId: abend.id },
      { songId: songId("Raster"), playlistId: abend.id },
      // Leere Liste: 0 Songs (Gegenprobe zu COUNT mit 0)
    ],
  });

  const playlists = await prisma.playlist.count();
  console.log(
    `Seed fertig: ${kuenstler} Künstler, ${songs} Songs, ${playlists} Playlists.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
