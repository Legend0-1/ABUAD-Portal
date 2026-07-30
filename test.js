require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function main() {
  try {
    console.log('Connecting...');
    await client.connect();

    console.log('Connected successfully!');

    const result = await client.query('SELECT NOW()');
    console.log(result.rows);

    await client.end();
    console.log('Disconnected.');
  } catch (err) {
    console.error('ERROR:');
    console.error(err);
  }
}

main();
