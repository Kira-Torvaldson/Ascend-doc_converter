'use strict';

/**
 * Smoke léger : valide docker-compose et, si la stack répond, ping /api/health.
 * N’échoue pas si Docker n’est pas disponible (skip explicite).
 */

const { spawnSync } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const COMPOSE_DIR = path.join(ROOT, 'container');

function run(cmd, args, cwd) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

function log(msg) {
  console.log(`[docker-compose-smoke] ${msg}`);
}

function main() {
  const version = run('docker', ['compose', 'version'], COMPOSE_DIR);
  if (version.status !== 0) {
    log('SKIP: docker compose indisponible');
    process.exit(0);
  }

  const cfg = run('docker', ['compose', 'config', '-q'], COMPOSE_DIR);
  if (cfg.status !== 0) {
    console.error(cfg.stderr || cfg.stdout);
    process.exit(1);
  }
  log('OK: docker compose config valide');

  const healthUrl = process.env.ASCEND_SMOKE_URL || 'http://127.0.0.1:3003/api/health';
  const req = http.get(healthUrl, { timeout: 2000 }, (res) => {
    log(`health ${healthUrl} → HTTP ${res.statusCode}`);
    process.exit(res.statusCode && res.statusCode < 500 ? 0 : 1);
  });
  req.on('error', () => {
    log(`SKIP: backend non joignable sur ${healthUrl} (compose up non requis)`);
    process.exit(0);
  });
  req.on('timeout', () => {
    req.destroy();
    log('SKIP: timeout health check');
    process.exit(0);
  });
}

main();
