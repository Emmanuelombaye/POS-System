import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000/api/shift-stock/closed-shifts';

// Mock auth token (doesn't matter for testing, just needs to exist)
const token = 'test-token';

(async () => {
  try {
    console.log('Testing /api/shift-stock/closed-shifts endpoint...');
    const response = await fetch(API_URL + '?branch_id=branch1&date=2024-01-20', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      console.error(`Status: ${response.status}`);
      const error = await response.text();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to test endpoint:', error);
  }
})();
