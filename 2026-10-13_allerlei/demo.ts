// demo.ts — Drizzle ORM am Musik-Katalog: Lesen, Schreiben, Auswerten.
// Zeigt zu jeder Query das erzeugte SQL (toSQL()) — ein ORM ersetzt SQL
// nicht, es erzeugt es. Laufen mit:  deno task demo
import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { oeffneDb } from "./db.ts";
import { album, artist, track } from "./schema.ts";

// Datei-DB im Projektordner — bei jedem Lauf neu anlegen.
await Deno.remove("musik.db").catch(() => {/* Datei fehlt: egal */});
const db = oeffneDb("musik.db");

// --- Schreiben: insert mit .returning() ------------------------------
const aera = await db.insert(artist)
  .values({ name: "Aera", gruendungsjahr: 1999 })
  .returning();
const nova = await db.insert(artist)
  .values({ name: "Nova", gruendungsjahr: 2012 })
  .returning();
const stille = await db.insert(album)
  .values({ titel: "Silent Lines", jahr: 2015, artistId: aera[0].id })
  .returning();
await db.insert(album)
  .values({ titel: "Night Ferry", jahr: 2012, artistId: nova[0].id });
await db.insert(track)
  .values({ titel: "Silent Lines", dauerSek: 215, albumId: stille[0].id });
await db.insert(track)
  .values({ titel: "Echo Room", dauerSek: 187, albumId: stille[0].id });

// --- Lesen: select .from() .where() ----------------------------------
const fragen = db.select().from(album).where(eq(album.artistId, aera[0].id));
console.log("Lesen, erzeugtes SQL:", fragen.toSQL().sql);
console.log("Lesen, Parameter:", fragen.toSQL().params);
console.log("Lesen, Ergebnis:", await fragen);

// --- Auswerten: orderBy, limit, count --------------------------------
const neueste = await db.select().from(album).orderBy(desc(album.jahr)).limit(
  1,
);
console.log("Neuestes Album:", neueste[0].titel, "(", neueste[0].jahr, ")");

const viele = await db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id);
console.log("Tracks pro Album:", viele);

// --- HÜ-Erweiterung: 3 Queries laut Aufgabe KM5-05 ------------------

// 1. Ältestes Album (orderBy + limit)
const aeltestesQuery = db.select().from(album).orderBy(asc(album.jahr)).limit(1);
console.log("HÜ 1, Ältestes Album SQL:", aeltestesQuery.toSQL().sql);
const aeltestes = await aeltestesQuery;
console.log("HÜ 1, Ältestes Album:", aeltestes[0].titel, "(", aeltestes[0].jahr, ")");

// 2. Tracks eines Albums mit Titel-Anfang „Echo“ (and + eq + like)
const echoQuery = db.select()
  .from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));
console.log("HÜ 2, Tracks mit 'Echo%' SQL:", echoQuery.toSQL().sql);
console.log("HÜ 2, Parameter:", echoQuery.toSQL().params);
const echoTracks = await echoQuery;
console.log("HÜ 2, Tracks mit 'Echo%':", echoTracks.map((t) => t.titel));

// 3. Anzahl Tracks je Album (count + groupBy)
const tracksProAlbumQuery = db.select({
  albumId: track.albumId,
  titel: album.titel,
  trackAnzahl: count(),
})
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(track.albumId, album.titel);
console.log("HÜ 3, Anzahl Tracks je Album SQL:", tracksProAlbumQuery.toSQL().sql);
const tracksJeAlbum = await tracksProAlbumQuery;
console.log("HÜ 3, Anzahl Tracks je Album:", tracksJeAlbum);

// --- Ändern: update .set() .where() ----------------------------------
await db.update(track)
  .set({ dauerSek: 220 })
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Silent%")));
const korrigiert = await db.select().from(track)
  .where(eq(track.titel, "Silent Lines"));
console.log("Nach update:", korrigiert[0].dauerSek, "Sekunden");

// --- Löschen: delete .where() ----------------------------------------
await db.delete(track).where(eq(track.titel, "Echo Room"));
const rest = await db.select({ anzahl: count() }).from(track);
console.log("Tracks nach delete:", rest[0].anzahl);

db.$client.close();
