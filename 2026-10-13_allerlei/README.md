# UE 2026-10-13 — Drizzle ORM (KM5-05)

**Fach:** INFI · **Klasse:** 3AHWII X · **Thema:** Typsicherer Datenbankzugriff mit Drizzle ORM (Deno + SQLite)  
**Lesson:** `lesson.html` (Prepared Lesson KM5-05 aus `unterricht/KM5-05-drizzle-orm/`)

→ Vollständige Lösung in [`loesung.md`](./loesung.md).

## Aufgaben

1. **Vorhersage:** SQL-Generierung für zwei Drizzle-Queries vor dem Ausführen ableiten (`select().from().where()`, `select({ n: count() })`).
2. **Beispielprojekt erweitern:** Drei Queries in `demo.ts` ergänzen:
   - Ältestes Album (`orderBy` + `limit`)
   - Tracks eines Albums mit Titel-Anfang „Echo“ (`and` + `eq` + `like`)
   - Anzahl Tracks je Album (`count` + `groupBy`)
3. **SQL-Vergleich (Interleaving):** Reine SQL-Query mit Drizzle-Generat vergleichen.
4. **Nachweis:** `deno task demo` und `deno task test` (12 Tests, alle bestanden).

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Diese Übersicht |
| `aufgabe.md` | Aufgabenstellung aus dem Lehrer-Repository |
| `KM5-05-drizzle-orm.md` | Lektionsüberblick & Housekeeping |
| `lesson.html` | Interaktive HTML-Lesson mit Quizzen |
| `assets/` | Stylesheet und Scripting der interaktiven Lesson |
| `schema.ts` | Drizzle-Schema (`artist`, `album`, `track`) |
| `db.ts` | SQLite-Verbindung über `node:sqlite` und DDL-Setup |
| `demo.ts` | Erweiterter Demo-Ablauf mit Konsolen- und `toSQL()`-Ausgaben |
| `demo_test.ts` | Testsuite (12 Tests inkl. Tests für die neuen HÜ-Queries) |
| `loesung.md` | Ausführliche Ausarbeitung aller vier Aufgabenteile |
| `deno.json` | Task-Konfiguration (`demo`, `test`) |

## Ausführen

```bash
deno task demo    # Zeigt CRUD-Operationen & SQL-Generierung
deno task test    # 12 passed | 0 failed
```
