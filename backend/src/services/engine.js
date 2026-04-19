export async function processMatches(current, previous) {
  for (const match of current) {
    const prev = previous.find(m => m.id === match.id);

    if (!prev) continue;

    if (match.odds && prev.odds) {
      const diff = match.odds.home - prev.odds.home;

      if (Math.abs(diff) > 0.2) {
        console.log(`ALERT: ${match.home} vs ${match.away} odds changed`);
      }
    }
  }
}
