# 🌍 CountryGuessr

React + Vite + **Tailwind CSS v4** frontend, Express + MongoDB backend (unchanged API).

## Games
**Quizzes**
| Game | What it is |
|---|---|
| 🚩 Flag Quiz | Name the country from its flag |
| 🏛️ Capital Quiz | Given a capital, find the country |
| 🗺️ Outline Quiz | Identify a country from its silhouette |
| 🧭 Border Patrol | Guess the country from its neighbours |
| 📍 Find on Map | Pan/zoom a real map and tap the named country (3 tries) |

**Puzzles**
| Game | What it is |
|---|---|
| 🎯 Countrydle | Wordle-style: distance, direction, region, population & border clues. Daily + practice |
| 🚂 Border Hop | Travel overland from A to B crossing land borders; par, undo and hints |
| 🔎 Odd One Out | Three flags share a subregion; spot the outsider |
| ⏱️ Name Them All | Type every country in a region/subregion before time runs out |

**Arcade**
| Game | What it is |
|---|---|
| 👥 Higher or Lower | Which country has more people? Streak game |
| 📊 Rank Them | Sort four countries by population; 3 lives |

Answers accept common aliases everywhere (USA, UK, Ivory Coast, Czech Republic…).

Quiz games support region filters, easy/medium/hard, and 10 / 20 / all rounds.
Guests can play without an account (scores aren't saved).

## Run it
```bash
cd frontend
npm install
npm run dev
```
Optional: `cp .env.example .env` and set `VITE_API_URL` to your own backend.
The backend is unchanged; see `backend/` (`npm run dev`, `node seed.js`).

## Map data
Outline, Countrydle distances and the globe locator use country shapes from
[world.geo.json](https://github.com/johan/world.geo.json) (Natural Earth).
They're fetched from a CDN at runtime. For fully offline/self-hosted use, download
`countries.geo.json` into `frontend/public/` — it's tried first.

## Structure
```
frontend/src
├─ index.css            Tailwind + "Night Atlas" theme tokens
├─ lib/                 api, utils, names (aliases), geo (d3-geo), hash router
├─ context/AppContext   countries, map data, user, score saving
├─ components/          ui, Navbar/BottomNav, CountryInput, Globe, WorldMap, SetupCard, ResultCard
├─ games/               registry, quiz/ (shared engine), one file per other game
└─ screens/             Home, Login, Leaderboard, Profile
```
To add a new game: add an entry to `games/registry.js` and render it in `games/index.jsx`.
