drop view if exists game_results_unord;

create view game_results_unord as
select name as heuristic
     , case name when white_heuristic then white_depth else black_depth end as heuristic_depth
     , case name when white_heuristic then black_heuristic else white_heuristic end as other
     , case name when white_heuristic then black_depth else white_depth end as other_depth
     , rule
     , moves
     , case (name, winner)
       when (white_heuristic, 'white') then 'win'
       when (black_heuristic, 'black') then 'win'
       when (white_heuristic, 'black') then 'loss'
       when (black_heuristic, 'white') then 'loss'
       else 'draw' end as result
     , duration_ms
  from heuristics
  join game_results
    on name in (white_heuristic, black_heuristic);

DROP VIEW IF EXISTS all_pairs_per_config;

CREATE VIEW all_pairs_per_config AS
WITH t AS (
  SELECT white_heuristic,
         black_heuristic,
         white_depth AS depth,
         rule,
         SUM(CASE winner WHEN 'white' THEN 1 ELSE 0 END) white_wins,
         SUM(CASE winner WHEN 'black' THEN 1 ELSE 0 END) black_wins,
         SUM(CASE winner WHEN 'draw' THEN 1 ELSE 0 END) draws,
         COUNT(*) total,
         AVG(duration_ms) avg_duration_ms
    FROM game_results
GROUP BY white_heuristic, black_heuristic, depth, rule
) SELECT *,
         100.0*white_wins/total white_perc,
         100.0*black_wins/total black_perc,
         100.0*draws/total draws_perc
    FROM t;

DROP VIEW IF EXISTS all_pairs_per_players;

CREATE VIEW all_pairs_per_players AS
WITH t AS (
  SELECT white_heuristic,
         black_heuristic,
         SUM(CASE winner WHEN 'white' THEN 1 ELSE 0 END) white_wins,
         SUM(CASE winner WHEN 'black' THEN 1 ELSE 0 END) black_wins,
         SUM(CASE winner WHEN 'draw' THEN 1 ELSE 0 END) draws,
         COUNT(*) total
    FROM game_results
GROUP BY white_heuristic, black_heuristic
) SELECT *,
         100.0*white_wins/total white_perc,
         100.0*black_wins/total black_perc,
         100.0*draws/total draws_perc
    FROM t;

DROP VIEW IF EXISTS unord_per_config;

CREATE VIEW unord_per_config AS  
WITH t AS (
  SELECT h0.name heuristic,
         h1.name against,
         g.white_depth depth,
         g.rule,
         SUM(CASE (g.winner, h0.name)
             WHEN ('white', g.white_heuristic) THEN 1
             WHEN ('black', g.black_heuristic) THEN 1
             ELSE 0
             END) wins,
         SUM(CASE (g.winner, h0.name)
             WHEN ('white', g.black_heuristic) THEN 1
             WHEN ('black', g.white_heuristic) THEN 1
             ELSE 0
             END) losses,
         SUM(CASE g.winner WHEN 'draw' THEN 1 ELSE 0 END) draws,
         COUNT(*) total
    FROM heuristics h0
    JOIN heuristics h1
      ON h1.name <> h0.name
    JOIN game_results g
      ON ((g.white_heuristic = h0.name AND g.black_heuristic = h1.name)
       OR (g.white_heuristic = h1.name AND g.black_heuristic = h0.name))
GROUP BY heuristic, against, depth, rule
) SELECT *,
         100.0*wins/total as wins_perc,
         100.0*losses/total as losses_perc,
         100.0*draws/total as draws_perc
    FROM t;

DROP VIEW IF EXISTS unord_per_players;

CREATE VIEW unord_per_players AS  
WITH t AS (
  SELECT h0.name heuristic,
         h1.name against,
         SUM(CASE (g.winner, h0.name)
             WHEN ('white', g.white_heuristic) THEN 1
             WHEN ('black', g.black_heuristic) THEN 1
             ELSE 0
             END) wins,
         SUM(CASE (g.winner, h0.name)
             WHEN ('white', g.black_heuristic) THEN 1
             WHEN ('black', g.white_heuristic) THEN 1
             ELSE 0
             END) losses,
         SUM(CASE g.winner WHEN 'draw' THEN 1 ELSE 0 END) draws,
         COUNT(*) total
    FROM heuristics h0
    JOIN heuristics h1
      ON h1.name <> h0.name
    JOIN game_results g
      ON ((g.white_heuristic = h0.name AND g.black_heuristic = h1.name)
       OR (g.white_heuristic = h1.name AND g.black_heuristic = h0.name))
GROUP BY heuristic, against
) SELECT *,
         100.0*wins/total as wins_perc,
         100.0*losses/total as losses_perc,
         100.0*draws/total as draws_perc
    FROM t;

DROP VIEW per_heuristic;

CREATE VIEW per_heuristic AS
WITH t AS (
  SELECT h.name heuristic,
         SUM(CASE (h.name, g.winner)
             WHEN (g.white_heuristic, 'white') THEN 1
             WHEN (g.black_heuristic, 'black') THEN 1
             ELSE 0
             END) wins,
         sum(CASE (h.name, g.winner)
             WHEN (g.black_heuristic, 'white') THEN 1
             WHEN (g.white_heuristic, 'black') THEN 1
             ELSE 0
             END) losses,
         SUM(CASE g.winner WHEN 'draw' THEN 1 ELSE 0 END) draws,
         COUNT(*) total
    FROM heuristics h
    JOIN game_results g
      ON h.name in (g.white_heuristic, g.black_heuristic)
GROUP BY heuristic
) SELECT *,
         100.0*wins/total AS wins_perc,
         100.0*losses/total AS losses_perc,
         100.0*draws/total AS draws_perc
    FROM t;

DROP VIEW compare_white_black;

CREATE VIEW compare_white_black AS
SELECT 'white' AS player, white_heuristic heuristic, AVG(white_perc) wins, AVG(black_perc) losses, AVG(draws_perc) draws
FROM all_pairs_per_players
GROUP BY heuristic
UNION
SELECT 'black' AS player, black_heuristic heuristic, AVG(black_perc) wins, AVG(white_perc) losses, AVG(draws_perc) draws
FROM all_pairs_per_players
GROUP BY heuristic;

DROP VIEW per_heuristic_per_depth;

CREATE VIEW per_heuristic_per_depth AS
   SELECT heuristic,
          depth,
          AVG(wins_perc) wins,
          AVG(losses_perc) losses,
          AVG(draws_perc) draws
    FROM unord_per_config
GROUP BY heuristic, depth;
