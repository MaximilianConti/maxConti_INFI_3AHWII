# UE 2026-09-29 — Node.js + Prisma 7 (N:M-Beziehungen)

**Fach:** INFI · **Klasse:** 3AHWII X
**Material (aus dem Lehrer-Repo übernommen):** `hausaufgabe.md`, `KM5-01-nodejs-prisma.md`,
`lesson.html`, `praxis/` (Scaffold)

→ Vollständige Lösung in [`loesung.md`](./loesung.md).

## Aufgaben

| # | Aufgabe | Umsetzung |
|---|---------|-----------|
| 1 | **Vorhersage** Query 1: Wie viele Songs ohne Label? | `songsOhneLabel()` — `COUNT(*)` = 4 vs. `COUNT(labelId)` = 3, weil `labelId` bei einem Song `NULL` ist |
| 2 | **N:M-Beziehung** Song ↔ Playlist aufbauen | Modelle `Playlist` + `SongPlaylist` (explizite Join-Tabelle, `@@id([songId, playlistId])`, `onDelete: Cascade`) |
| 3 | **Query** Songs pro Playlist | `songsProPlaylist()` via `include: { _count: { select: { songs: true } } }` |
| 4 | **Tests** | `node:test`, 7 Assertions (5 Original + 2 neue für N:M) |

## Ausführen

```bash
cd praxis
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run run     # 6 Konsolenzeilen
npm test        # 7 passed
```

## Dateien

| Datei | Zweck |
|-------|-------|
| `loesung.md` | **meine Lösung**: Vorhersage, Setup-Protokoll, Abweichungen mit Begründung, N:M-Schema, Tests, Reflexion |
| `praxis/prisma/schema.prisma` | Modelle `Label`, `Kuenstler`, `Song` + `Playlist`, `SongPlaylist` |
| `praxis/src/seed.js` | idempotenter Seed (4 Künstler, 7 Songs, 3 Playlists) |
| `praxis/src/queries.js` | 6 Queries über die Prisma-API |
| `praxis/test/queries.test.js` | 7 Tests |
| `praxis/prisma/migrations/` | `20260928220811_init` + `20261021074552_add_playlist` |

## Zwei Stolpersteine (dokumentiert in `loesung.md`)

1. **Windows-Pfad-Bug im Starter:** `import.meta.url === \`file://${process.argv[1]}\``
   greift unter Windows nie (Backslash-Pfad). Behoben mit
   `pathToFileURL(process.argv[1]).href` plus Guard gegen `process.argv[1] === undefined`.
2. **Prisma 7 + npm 10:** `npm approve-scripts --all` existiert erst ab npm 11; nach
   Schema-Änderungen ist `npm run db:generate` nötig.
