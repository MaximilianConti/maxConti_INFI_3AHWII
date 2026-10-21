-- CreateTable
CREATE TABLE "Kunde" (
    "kundeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Hobby" (
    "kundeId" INTEGER NOT NULL,
    "hobby" TEXT NOT NULL,

    PRIMARY KEY ("kundeId", "hobby"),
    CONSTRAINT "Hobby_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("kundeId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plz" (
    "plz" TEXT NOT NULL PRIMARY KEY,
    "ort" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Bestellung" (
    "bestellNr" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kunde" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    CONSTRAINT "Bestellung_plz_fkey" FOREIGN KEY ("plz") REFERENCES "Plz" ("plz") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bestellposition" (
    "bestellNr" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,

    PRIMARY KEY ("bestellNr", "position"),
    CONSTRAINT "Bestellposition_bestellNr_fkey" FOREIGN KEY ("bestellNr") REFERENCES "Bestellung" ("bestellNr") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bestellposition_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Song" ("songId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "songId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "dauerSek" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Playlist" (
    "playlistId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SongPlaylist" (
    "songId" INTEGER NOT NULL,
    "playlistId" INTEGER NOT NULL,

    PRIMARY KEY ("songId", "playlistId"),
    CONSTRAINT "SongPlaylist_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("songId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongPlaylist_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("playlistId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produkt" (
    "produktNr" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BestellpositionProd" (
    "bestellNr" INTEGER NOT NULL,
    "produktNr" INTEGER NOT NULL,
    "menge" INTEGER NOT NULL,

    PRIMARY KEY ("bestellNr", "produktNr"),
    CONSTRAINT "BestellpositionProd_bestellNr_fkey" FOREIGN KEY ("bestellNr") REFERENCES "Bestellung" ("bestellNr") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BestellpositionProd_produktNr_fkey" FOREIGN KEY ("produktNr") REFERENCES "Produkt" ("produktNr") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pruefung" (
    "matrNr" INTEGER NOT NULL,
    "lvNr" TEXT NOT NULL,
    "note" INTEGER NOT NULL,

    PRIMARY KEY ("matrNr", "lvNr")
);

-- CreateTable
CREATE TABLE "Blz" (
    "blz" TEXT NOT NULL PRIMARY KEY,
    "bankname" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Konto" (
    "iban" TEXT NOT NULL PRIMARY KEY,
    "inhaber" TEXT NOT NULL,
    "blz" TEXT NOT NULL,
    CONSTRAINT "Konto_blz_fkey" FOREIGN KEY ("blz") REFERENCES "Blz" ("blz") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "svnr" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    CONSTRAINT "Person_plz_fkey" FOREIGN KEY ("plz") REFERENCES "Plz" ("plz") ON DELETE RESTRICT ON UPDATE CASCADE
);
