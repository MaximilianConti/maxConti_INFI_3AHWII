-- auffrischung.sql — HÜ 2026-09-29 (Rep ohne Node), 5 Auffrischungs-Queries aus
-- Lesson 0001 §4. DB vorher: sqlite3 musik-mini.db < seed-musik-mini.sql
-- Jede Query in einem Kommentar: was beantwortet sie?

-- 1. Top-Künstler nach Track-Anzahl (JOIN + GROUP BY + ORDER + LIMIT).
--    Beantwortet: Welche 5 Künstler haben die meisten Songs?
SELECT k.name, COUNT(*) AS tracks
FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
GROUP BY k.id
ORDER BY tracks DESC
LIMIT 5;

-- 2. Künstlerpaare desselben Labels (Self-JOIN, x.id < y.id gegen Doppelpaare).
--    Beantwortet: Welche Künstler teilen sich ein Label (als Paar)?
SELECT x.name AS a, y.name AS b, l.name AS label
FROM kuenstler x
JOIN kuenstler y ON x.label_id = y.label_id AND x.id < y.id
JOIN label l ON l.id = x.label_id;

-- 3. Labels mit mehr als einem Künstler (HAVING filtert Gruppen, nicht Zeilen).
--    Beantwortet: Welche Labels haben mehr als einen Künstler unter Vertrag?
SELECT l.name, COUNT(*) AS n
FROM kuenstler k JOIN label l ON l.id = k.label_id
GROUP BY l.id
HAVING COUNT(*) > 1;

-- 4. COUNT(*) vs. COUNT(label_id): ein Künstler hat (noch) kein Label (NULL).
--    Beantwortet: Wie viele Künstler gibt es insgesamt, wie viele haben ein Label?
SELECT COUNT(*) AS alle, COUNT(label_id) AS mit_label FROM kuenstler;

-- 5. WHERE + HAVING kombiniert: nur lange Songs (>200s) je Künstler, nur Künstler mit 2+ langen Songs.
--    Beantwortet: Welche Künstler haben mindestens 2 Songs länger als 200 Sekunden?
SELECT k.name, COUNT(*) AS n
FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
WHERE s.dauer_sek > 200
GROUP BY k.id
HAVING COUNT(*) >= 2;