const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const serverDir = path.join(__dirname, '..');
const envPath = process.env.STOCKSENSE_ENV_PATH || path.join(serverDir, '.env.local');
const baseEnvPath = path.join(serverDir, '.env');
const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const baseContent = !process.env.STOCKSENSE_ENV_PATH && fs.existsSync(baseEnvPath)
  ? fs.readFileSync(baseEnvPath, 'utf8')
  : '';
const values = { ...dotenv.parse(baseContent), ...dotenv.parse(existingContent) };
const email = values.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = values.BOOTSTRAP_ADMIN_PASSWORD;
const name = values.BOOTSTRAP_ADMIN_NAME?.trim() || 'StockSense Administrator';
const localValues = dotenv.parse(existingContent);
const demoEmail = 'admin@stocksense.local';

function writeClientDemoCredentials(demoPassword) {
  const clientEnvPath = path.join(serverDir, '..', 'client', '.env.local');
  const clientContent = fs.existsSync(clientEnvPath) ? fs.readFileSync(clientEnvPath, 'utf8') : '';
  const clientValues = {
    ...dotenv.parse(clientContent),
    VITE_DEMO_ADMIN_EMAIL: demoEmail,
    VITE_DEMO_ADMIN_PASSWORD: demoPassword,
  };
  const updatedKeys = new Set(['VITE_DEMO_ADMIN_EMAIL', 'VITE_DEMO_ADMIN_PASSWORD']);
  const preservedLines = clientContent
    .split(/\r?\n/)
    .filter((line) => !updatedKeys.has(line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1]));
  const output = `${preservedLines.join('\n').trimEnd()}\nVITE_DEMO_ADMIN_EMAIL=${clientValues.VITE_DEMO_ADMIN_EMAIL}\nVITE_DEMO_ADMIN_PASSWORD=${clientValues.VITE_DEMO_ADMIN_PASSWORD}\n`;

  fs.mkdirSync(path.dirname(clientEnvPath), { recursive: true });
  fs.writeFileSync(clientEnvPath, output, { mode: 0o600 });
  fs.chmodSync(clientEnvPath, 0o600);
}

if (email && password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be valid and BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
  }
  if (!process.env.STOCKSENSE_ENV_PATH && localValues.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() === demoEmail) {
    writeClientDemoCredentials(localValues.BOOTSTRAP_ADMIN_PASSWORD);
  }
  console.log(`Using configured Admin account: ${email}`);
  process.exit(0);
}

if (email || password) {
  throw new Error('Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, or leave both blank to generate a local demo Admin.');
}

const demoPassword = crypto.randomBytes(24).toString('base64url');
const updates = {
  BOOTSTRAP_ADMIN_EMAIL: demoEmail,
  BOOTSTRAP_ADMIN_PASSWORD: demoPassword,
  BOOTSTRAP_ADMIN_NAME: name,
};
const updatedKeys = new Set(Object.keys(updates));
const preservedLines = existingContent
  .split(/\r?\n/)
  .filter((line) => !updatedKeys.has(line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1]));
const output = `${preservedLines.join('\n').trimEnd()}\n${Object.entries(updates)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}\n`;

fs.mkdirSync(path.dirname(envPath), { recursive: true });
fs.writeFileSync(envPath, output, { mode: 0o600 });
fs.chmodSync(envPath, 0o600);
writeClientDemoCredentials(demoPassword);

console.log('Created local demo Admin account:');
console.log(`Email: ${demoEmail}`);
console.log(`Password: ${demoPassword}`);
console.log('Save these credentials securely. They are stored in server/.env.local and will not be shown again.');
