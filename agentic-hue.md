# Agentic-Coding HÜ (2026-09-15, Sondereinheit — X-Gruppe)

Erledigt:

- `opencode` installiert und lauffähig: `opencode --version` (Nachweis im Unterricht).
- Freier Provider verbunden (`/connect`).
- Im eigenen Repo `/init` gelaufen, `AGENTS.md` angepasst und committet.

## Was `AGENTS.md` steuert

Die Datei `./AGENTS.md` (Root dieses Repos) ist die Projekt-Anweisung für den
Agenten: Sie erklärt den Zweck des Repos (INFI-HÜ-Abgaben für 3AHWII X), den
Stack (Deno + `node:sqlite`/`sqlite3`, kein Node/npm in den ohne-Node-HÜs),
und die Regeln (Ordnerstruktur des Lehrers erhalten, Tests grün machen,
`.db`-Dateien nicht committen, kleine sprechende Commits). Damit arbeitet ein
Agent hier automatisch im richtigen Stil, ohne wieder nachgefragt werden zu
müssen.