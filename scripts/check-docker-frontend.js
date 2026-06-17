'use strict'

const { execSync } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const tag = process.env.ASCEND_DOCKER_TAG_FRONTEND || 'ascend-frontend:local-check'

function run (command) {
  execSync(command, { cwd: ROOT, stdio: 'inherit' })
}

console.log(`[INFO] Build image ${tag} (context: repo root)`)
run(`docker build -f container/frontend/Dockerfile -t ${tag} .`)

console.log('[INFO] Verify SPA build in image')
run(`docker run --rm ${tag} sh -c "test -f /usr/share/nginx/html/index.html && nginx -v"`)

console.log('[OK] Docker frontend build + nginx check passed.')
