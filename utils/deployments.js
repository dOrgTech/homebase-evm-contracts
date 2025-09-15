const fs = require('fs');
const path = require('path');

function deploymentsDir() {
  return path.join(__dirname, '..', 'deployments');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fileFor(networkName) {
  return path.join(deploymentsDir(), `${networkName}.json`);
}

function loadAddresses(networkName) {
  const file = fileFor(networkName);
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

function saveAddresses(networkName, addresses) {
  ensureDir(deploymentsDir());
  const file = fileFor(networkName);
  const sorted = Object.keys(addresses)
    .sort()
    .reduce((acc, k) => ((acc[k] = addresses[k]), acc), {});
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2));
  return file;
}

module.exports = { loadAddresses, saveAddresses };

