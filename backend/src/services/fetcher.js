import axios from 'axios';

export async function fetchMatches() {
  const url = process.env.FOOTBALL_API;

  const res = await axios.get(url);

  return res.data.matches || [];
}
