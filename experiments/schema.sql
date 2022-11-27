DROP TABLE IF EXISTS heuristics;

CREATE TABLE heuristics (
 name text
);

INSERT INTO heuristics VALUES
('heuristicCountPieces'),
('heuristicCountPiecesWeighted'),
('heuristicClusters'),
('heuristicWeighDistance');

DROP TABLE IF EXISTS game_results;

CREATE TABLE game_results (
  white_heuristic text,
  white_depth int,
  black_heuristic text,
  black_depth int,
  rule text,
  winner text,
  moves int,
  white_pawns int,
  white_kings int,
  black_pawns int,
  black_kings int,
  duration_ms int
);

-----------
-- baseline
-- use these views when evaluating results from run-against-baseline

DROP VIEW IF EXISTS baseline_experiments;

/* easier to query on */
CREATE VIEW baseline_experiments AS
SELECT black_heuristic AS heuristic,
       black_depth AS depth,
       rule,
       moves,
       CASE winner
         WHEN 'white' THEN 'loss'
         WHEN 'black' THEN 'win'
         ELSE 'draw'
       END AS result,
      duration_ms
  FROM game_results;

DROP VIEW IF EXISTS baseline_grouped;

/* even easier to query on */
CREATE VIEW baseline_grouped AS
WITH counts AS (
    SELECT heuristic,
           depth,
           rule,
           SUM(CASE result WHEN 'win' THEN 1 ELSE 0 END) AS wins,
           SUM(CASE result WHEN 'draw' THEN 1 ELSE 0 END) AS draws,
           SUM(CASE result WHEN 'loss' THEN 1 ELSE 0 END) AS losses,
           COUNT(1) as total,
           AVG(duration_ms) as avg_duration_ms
      FROM baseline_experiments
  GROUP BY heuristic, depth, rule
) SELECT heuristic,
         depth,
         rule,
         wins,
         draws,
         losses,
         total,
         100.0 * wins / total AS wins_perc,
         100.0 * draws / total AS draws_perc,
         100.0 * losses / total AS losses_perc,
         avg_duration_ms
    FROM counts;

--------------------
-- eachother ordered
-- distinguishing which player started
-- use these views when evaluating results from running run-against-eachother.js

DROP VIEW IF EXISTS eachother_grouped;

CREATE VIEW eachother_grouped aS
  SELECT white_heuristic,
         black_heuristic,
         white_depth AS depth,
         SUM(CASE winner WHEN 'white' THEN 1 ELSE 0 END) AS white_wins,
         SUM(CASE winner WHEN 'black' THEN 1 ELSE 0 END) AS black_wins,
         SUM(CASE winner WHEN 'draw' THEN 1 ELSE 0 END) AS draws,
         COUNT(1) AS total,
         AVG(duration_ms) AS avg_duration_ms
    FROM game_results
GROUP BY white_heuristic, black_heuristic, depth;

DROP VIEW IF EXISTS eachother_pairs;

CREATE VIEW eachother_pairs AS
  SELECT 
    white_heuristic,
    black_heuristic,
    SUM(white_wins) white_wins,
    SUM(black_wins) black_wins,
    SUM(draws) draws,
    SUM(total) total,
    AVG(avg_duration_ms) avg_duration_ms
  FROM
    eachother_grouped
  GROUP BY
    white_heuristic,
    black_heuristic;

----------------------
-- eachother unordered
-- without distinguishing which player started

drop view if exists eachother_grouped_unordered;

create view eachother_grouped_unordered as
  select h1.name heuristic,
         h2.name against,
         g.depth,
         sum(iif(h1.name = g.white_heuristic, g.white_wins, g.black_wins)) as wins,
         sum(draws) as draws,
         sum(iif(h1.name = g.white_heuristic, g.black_wins, g.white_wins)) as losses,
         sum(total) as total
    from heuristics h1
left join heuristics h2 on h2.name <> h1.name
left join eachother_grouped g
      on ((h1.name = g.white_heuristic and h2.name = g.black_heuristic)
       or (h1.name = g.black_heuristic and h2.name = g.white_heuristic))
group by h1.name, h2.name, g.depth;

drop view if exists eachother_pairs_unordered;

create view eachother_pairs_unordered as
   select heuristic, against, sum(wins) as wins, sum(draws) as draws, sum(losses) as losses, sum(total) as total
    from eachother_grouped_unordered
group by heuristic, against;

drop view if exists eachother_per_heuristic;

create view eachother_per_heuristic as
  select heuristic, sum(wins) as wins, sum(draws) as draws, sum(losses) as losses, sum(total) as total
    from eachother_pairs_unordered
group by heuristic;

drop view if exists eachother_grouped_unordered_dedup;

create view eachother_grouped_unordered_dedup as
select * from eachother_grouped_unordered where heuristic < against;

drop view if exists eachother_pairs_unordered_dedup;

create view eachother_pairs_unordered_dedup as
select * from eachother_pairs_unordered where heuristic < against;
