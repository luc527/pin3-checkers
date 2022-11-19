const depths = [ 5, 6, 7, 8, 9, 10 ];

const heuristicPairs = [

  [ 'heuristicCountPiecesWeighted', 'heuristicCountPiecesWeighted' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicWeighDistance' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicClusters' ],

  [ 'heuristicCountPiecesWeighted', 'heuristicWeighDistance' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicClusters' ],

  [ 'heuristicWeighDistance', 'heuristicClusters '],
];

const rules = [ 1, 3 ];

const runs = 50;

const results = [];