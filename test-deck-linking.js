const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDeckLinking() {
  try {
    console.log('Fetching decks...');
    const decks = await makeRequest('/api/decks');
    console.log(`Found ${decks.length} decks\n`);
    
    let totalCards = 0;
    for (const deck of decks) {
      const cards = await makeRequest(`/api/decks/${deck.id}/cards`);
      const cardCount = Array.isArray(cards) ? cards.length : 0;
      totalCards += cardCount;
      console.log(`${deck.title}: ${cardCount} cards`);
    }
    
    console.log(`\nTotal cards: ${totalCards}`);
    console.log(`Average per deck: ${Math.round(totalCards / decks.length)}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

// Wait a moment for server to be ready
setTimeout(testDeckLinking, 1000);
