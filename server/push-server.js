
/**
 * BACKEND PUSH NOTIFICATION SERVER (Node.js)
 * 
 * Instructions:
 * 1. Deploy this script to a VPS or Heroku.
 * 2. Set env variables: API_KEY (API-Football) and VAPID_KEYS.
 * 3. This script will poll matches every minute and send Push Notifications 
 *    to all subscribed users via the 'web-push' library.
 */

const webpush = require('web-push');
const fetch = require('node-fetch'); // Needs 'node-fetch' package
const API_KEY = process.env.API_KEY;

// VAPID keys should be generated once: ./node_modules/.bin/web-push generate-vapid-keys
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
  'mailto:admin@footalert.com',
  publicVapidKey,
  privateVapidKey
);

// In a real app, these subscriptions come from your Database (users who allowed notifications)
const userSubscriptions = [
  // { endpoint: '...', keys: { ... } } 
];

// Logic to check matches (Simplified version of the Frontend engine)
async function checkMatchesAndNotify() {
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await response.json();
    const liveMatches = data.response || [];

    // Example Strategy: Over 2.5 Goals
    liveMatches.forEach(match => {
      const totalGoals = match.goals.home + match.goals.away;
      
      // If condition met
      if (totalGoals > 2.5) {
        const payload = JSON.stringify({
          title: `Goal Alert! ${match.teams.home.name} vs ${match.teams.away.name}`,
          body: `Over 2.5 Goals hit! Score: ${match.goals.home}-${match.goals.away}`,
          url: `https://footalert.app/match/${match.fixture.id}`
        });

        // Send to all subscribers
        userSubscriptions.forEach(sub => {
          webpush.sendNotification(sub, payload).catch(err => console.error(err));
        });
      }
    });

  } catch (err) {
    console.error('Error fetching matches:', err);
  }
}

// Run every 60 seconds
setInterval(checkMatchesAndNotify, 60000);
console.log('Push Server Running...');
