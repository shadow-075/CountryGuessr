export const API = (import.meta.env.VITE_API_URL || 'https://country-guessr-12.vercel.app').replace(/\/$/, '');

export const flagSrc = (id) => `${API}/api/countries/flag/${id}`;

async function json(res) {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

const send = (path, method, body) =>
  fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json);

export const getCountries = () => fetch(`${API}/api/countries`).then(json);
export const loginUser = (username) => send('/api/users/login', 'POST', { username });
export const postScore = (username, score) => send('/api/users/score', 'PUT', { username, score });
export const getLeaderboard = () => fetch(`${API}/api/users/leaderboard`).then(json);
