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

