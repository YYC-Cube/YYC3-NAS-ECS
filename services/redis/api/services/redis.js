const { createClient } = require('redis');

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT || '6380', 10);
const password = process.env.REDIS_PASSWORD || undefined;
const useTls = String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true';
const namespace = process.env.REDIS_NAMESPACE || 'api';
const timeoutMs = parseInt(process.env.REDIS_TIMEOUT_MS || '2000', 10);

const url = `redis://${host}:${port}`;

const client = createClient({
  url,
  password,
  name: namespace,
  socket: {
    tls: useTls,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    connectTimeout: timeoutMs
  }
});

client.on('error', (err) => {
  console.error('[Redis] client error:', err.message);
});
client.on('connect', () => {
  console.log('[Redis] connecting...');
});
client.on('ready', () => {
  console.log('[Redis] ready');
});

async function init() {
  if (!client.isOpen) {
    await client.connect();
  }
}

async function ping() {
  if (!client.isOpen) {
    await init();
  }
  return client.ping();
}

module.exports = { client, init, ping };
