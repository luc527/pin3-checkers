/* aggregating over game configs */
  select white_heuristic
       , white_depth
       , black_heuristic
       , black_depth
       , rule
       , sum(case winner when "white" then 1 else 0 end) as white_wins
       , sum(case winner when "black" then 1 else 0 end) as black_wins
       , sum(case winner when "draw" then 1 else 0 end) as draws
       , printf("%.2f", avg(moves)) as avg_moves
    from game_results
group by white_heuristic, white_depth, black_heuristic, black_depth, rule;

/* aggregating over players */
  select white_heuristic
       , black_heuristic
       , sum(case winner when "white" then 1 else 0 end) as white_wins
       , sum(case winner when "black" then 1 else 0 end) as black_wins
       , sum(case winner when "draw" then 1 else 0 end) as draws
       , printf("%.2f", avg(moves)) as avg_moves
    from game_results
group by white_heuristic, black_heuristic;

/* wins by heuristic*/
with heuristics as (
  select distinct white_heuristic as name from game_results
  union
  select distinct black_heuristic as name from game_results
) select h.name as heuristic
       , sum(case (h.name, g.winner)
               when (g.white_heuristic, "white") then 1
               when (g.black_heuristic, "black") then 1
               else 0
             end) as wins
       , sum(case g.winner when "draw" then 1 else 0 end) as draws
       , sum(case (h.name, g.winner)
               when (g.white_heuristic, "black") then 1
               when (g.black_heuristic, "white") then 1
               else 0
             end) as losses
       , count(1) as total
    from heuristics h
    join game_results g
      on (g.white_heuristic = h.name or g.black_heuristic = h.name)
group by h.name;
  

/* wins by heuristic (when playing against baseline, always white) */
with heuristics as (
  select distinct black_heuristic as name from game_results
) select h.name as heuristic
       , sum(case (h.name, g.winner)
               when (g.white_heuristic, "white") then 1
               when (g.black_heuristic, "black") then 1
               else 0
             end) as wins
       , sum(case g.winner when "draw" then 1 else 0 end) as draws
       , sum(case (h.name, g.winner)
               when (g.white_heuristic, "black") then 1
               when (g.black_heuristic, "white") then 1
               else 0
             end) as losses
       , count(1) as total
    from heuristics h
    join game_results g
      on (g.white_heuristic = h.name or g.black_heuristic = h.name)
group by h.name;
