export const GAMES = {
  flag: {
    id: 'flag', title: 'Flag Quiz', emoji: '🚩', tag: 'Classic',
    blurb: 'Name the country behind the flag.',
    glow: 'from-coral/25', quiz: true, group: 'Quizzes',
  },
  capital: {
    id: 'capital', title: 'Capital Quiz', emoji: '🏛️', tag: 'Classic',
    blurb: 'You get the capital — find the country.',
    glow: 'from-sky/25', quiz: true, group: 'Quizzes',
  },
  outline: {
    id: 'outline', title: 'Outline Quiz', emoji: '🗺️', tag: 'New',
    blurb: 'Identify a country from its silhouette alone.',
    glow: 'from-sun/25', quiz: true, needsGeo: true, group: 'Quizzes',
  },
  neighbors: {
    id: 'neighbors', title: 'Border Patrol', emoji: '🧭', tag: 'New',
    blurb: 'Given its neighbours, which country is it?',
    glow: 'from-lagoon/25', quiz: true, group: 'Quizzes',
  },
  countrydle: {
    id: 'countrydle', title: 'Countrydle', emoji: '🎯', tag: 'Daily',
    blurb: 'Wordle for geography. Distance, direction and clues guide you in.',
    glow: 'from-sun/25', group: 'Puzzles',
  },
  higherlower: {
    id: 'higherlower', title: 'Higher or Lower', emoji: '👥', tag: 'Arcade',
    blurb: 'Which country has more people? Build the longest streak.',
    glow: 'from-coral/25', group: 'Arcade',
  },
  findmap: {
    id: 'findmap', title: 'Find on Map', emoji: '📍', tag: 'New',
    blurb: 'Zoom around a real map and tap the country you are asked for.',
    glow: 'from-sky/25', needsGeo: true, group: 'Quizzes',
  },
  borderhop: {
    id: 'borderhop', title: 'Border Hop', emoji: '🚂', tag: 'New',
    blurb: 'Cross land borders one country at a time to reach the destination.',
    glow: 'from-lagoon/25', group: 'Puzzles',
  },
  oddone: {
    id: 'oddone', title: 'Odd One Out', emoji: '🔎', tag: 'New',
    blurb: 'Three flags share a neighbourhood. Which one is the outsider?',
    glow: 'from-coral/25', group: 'Puzzles',
  },
  nameall: {
    id: 'nameall', title: 'Name Them All', emoji: '⏱️', tag: 'Timed',
    blurb: 'Race the clock to type every country in a region.',
    glow: 'from-sun/25', group: 'Puzzles',
  },
  rank: {
    id: 'rank', title: 'Rank Them', emoji: '📊', tag: 'Arcade',
    blurb: 'Sort four countries by population before you run out of lives.',
    glow: 'from-sky/25', group: 'Arcade',
  },
};

export const GAME_LIST = Object.values(GAMES);

export const GROUPS = ['Quizzes', 'Puzzles', 'Arcade'];
