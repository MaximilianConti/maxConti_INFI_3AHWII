// AGENTS.md — maxConti_INFI_3AHWII (3AHWII X, INFI, HTL Spengergasse)
// Angepasst nach /init (offene Werkstatt 2026-09-15).

# AGENTS.md

Projekt-Anweisung für Coding-Agenten in diesem Repository.

## Zweck des Repos

Abgaben (Hausübungen) im Fach INFI (3AHWII X): Lösungen zu den vom Lehrer
bereitgestellten HÜ-Ordnern, jeweils als Kopie der Ordnerstruktur
(`2026-09-29_rep-ohne-node/`, `2026-10-06_normalisierung-3nf/`, ...).

## Stack

- Laufzeit: Deno (TypeScript).
- Datenbank: SQLite (`sqlite3`-CLI, `node:sqlite`). Kein Node/npm/Prisma
  in den ohne-Node-HÜs.

## Regeln

- Die vom Lehrer übernommene Ordnerstruktur bleibt erhalten; HÜ-Dateien
  (`auffrischung.sql`, `zerlegung.sql`, Lösungs-Markdown) werden im
  jeweiligen HÜ-Ordner abgelegt.
- Tests grün machen: `deno task test` (bzw. `deno test`).
- Seed vor Tests laden, z. B. `sqlite3 test-mini.db < seed-musik-mini.sql`.
- Keine Secrets in Prompts oder Repo; keine `.db`-Dateien committen
  (siehe `.gitignore`).
- Kleine, sprechende Commits; Änderungen erst im Diff prüfen.

## Befehle

- Tests: `deno task test`
- 3NF-Demo: `deno task demo` (2026-10-06)
- SQL ausführen: `sqlite3 <datei>.db < <skript>.sql`