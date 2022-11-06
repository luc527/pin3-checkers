DROP TABLE IF EXISTS heuristics;

CREATE TABLE heuristics (
 name text
);

INSERT INTO heuristics VALUES
('heuristicCountPiecesUnweighted'),
('heuristicCountPieces'),
('heuristicClusters'),
('heuristicWeightDistance');

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
  black_kings int
);

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
       END AS result
  FROM game_results;

DROP VIEW IF EXISTS experiments_grouped;

/* even easier to query on */
CREATE VIEW experiments_grouped AS
WITH counts AS (
    SELECT heuristic,
           depth,
           rule,
           SUM(CASE result WHEN 'win' THEN 1 ELSE 0 END) AS wins,
           SUM(CASE result WHEN 'draw' THEN 1 ELSE 0 END) AS draws,
           SUM(CASE result WHEN 'loss' THEN 1 ELSE 0 END) AS losses,
           COUNT(1) as total
      FROM baseline_experiments
  GROUP BY heuristic, depth, rule
) SELECT heuristic,
         depth,
         rule,
         100.0 * wins / total AS win_perc,
         100.0 * draws / total AS draws_perc,
         100.0 * losses / total AS losses_perc
    FROM counts;
