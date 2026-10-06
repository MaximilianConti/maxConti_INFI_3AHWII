# Leseauftrag — Frage 6 (HÜ, schriftlich)

**Transfer:** Setze den Artikel zu unserer Lage in Beziehung: Deno mit
eingebautem `node:sqlite`, Prisma-7-Adapter-Pflicht (`better-sqlite3` nativ)
und npm-`latest`, das auf einen 8.0.0-RC zeigt.

Der Artikel liest sich für unsere Klasse wie eine Warnung mit gutem Timing:
Prisma 7 bringt zwar eine kleinere Runtime und schnellere Cold Starts mit,
aber der Weg dahin zeigt genau die Stolperfallen, die uns am 22.09. schon
erwischt haben — native Adapter wie `better-sqlite3`, der Versionsdruck von
npm-`latest` bis in RC-Bereiche, `node_modules`-Berge. Deno liefert mit
`node:sqlite` das exakt gleiche Ergebnis (verbinden, Query, Resultat) ohne
jede Zusatz-Schicht und ohne Installrisiko — für uns also die robustere
Lösung fürs Erste. Ein ORM bezahlt sich dort, wo ein Team `SELECT`/`JOIN`
nicht mehr handisch schreiben will und viele Relationen verwaltet; wir tun
das gerade noch ausdrücklich selbst, um SQL wirklich zu können (KM3/KM5).
Würden wir später doch ein ORM nehmen, spricht die Faustregel des Artikels
für Drizzle: Es bleibt „SQL-first", zeigt die DB statt sie zu verstecken,
und passt damit zu unserem Deno-Workflow ohne eigenen Schema-Dialekt und
ohne `prisma generate`-Pflicht. Kurz: reines SQL zuerst — weil wir es noch
lernen müssen und es riskant klingt, eine zweite Abstraktionsschicht über
eine Werkzeugkette zu legen, die sich gerade selbst repariert.