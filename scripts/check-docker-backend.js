'use strict'

const { execSync } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const tag = process.env.ASCEND_DOCKER_TAG || 'ascend-backend:local-check'

function run (command) {
  execSync(command, { cwd: ROOT, stdio: 'inherit' })
}

console.log(`[INFO] Build image ${tag} (context: repo root)`)
run(`docker build -f container/backend/Dockerfile -t ${tag} .`)

console.log('[INFO] Verify pandoc in image')
run(`docker run --rm ${tag} pandoc --version`)

console.log('[OK] Docker backend build + pandoc check passed.')
