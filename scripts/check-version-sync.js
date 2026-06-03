'use strict'

/**
 * ASC-002 — Verification de coherence des versions
 *
 * Compare la version declaree dans toutes les zones critiques et echoue
 * (exit 1) si une divergence est detectee. Destine a etre execute en CI
 * avant tout merge / publication de release.
 *
 * Usage:
 *   node scripts/check-version-sync.js
 *
 * Sources verifiees:
 *   - api/frontend/package.json        (champ "version")
 *   - api/backend/package.json         (champ "version")
 *   - api/frontend/package-lock.json   (champ "version" racine)
 *   - api/backend/package-lock.json    (champ "version" racine)
 *   - README.md                        (badge version-X-orange)
 *   - changelog.md                     (premiere entree ### X)
 *   - api/frontend/src/App.tsx         (label "Nouveautes vX")
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8')
}

function pkgVersion(file) {
  try {
    return JSON.parse(read(file)).version || null
  } catch (err) {
    return null
  }
}

function firstMatch(file, regex) {
  try {
    const m = read(file).match(regex)
    return m ? m[1] : null
  } catch (err) {
    return null
  }
}

function main() {
  const sources = [
    { label: 'frontend package.json', version: pkgVersion('api/frontend/package.json') },
    { label: 'backend package.json', version: pkgVersion('api/backend/package.json') },
    { label: 'frontend package-lock.json', version: pkgVersion('api/frontend/package-lock.json') },
    { label: 'backend package-lock.json', version: pkgVersion('api/backend/package-lock.json') },
    { label: 'README.md (badge)', version: firstMatch('README.md', /version-([0-9.]+)-orange/) },
    { label: 'changelog.md (1ere entree)', version: firstMatch('changelog.md', /###\s+([0-9.]+)\s+\(/) },
    { label: 'App.tsx (label)', version: firstMatch('api/frontend/src/App.tsx', /Nouveautés v([0-9.]+)/) }
  ]

  console.log('[INFO] Versions detectees:')
  for (const s of sources) {
    console.log(`  - ${s.label}: ${s.version === null ? '(introuvable)' : s.version}`)
  }

  const missing = sources.filter((s) => s.version === null)
  if (missing.length > 0) {
    console.error(`\n[ERROR] Version introuvable dans: ${missing.map((s) => s.label).join(', ')}`)
    process.exit(1)
  }

  const reference = sources[0].version
  const diverging = sources.filter((s) => s.version !== reference)

  if (diverging.length > 0) {
    console.error(`\n[ERROR] Versions desynchronisees (reference = ${reference} via ${sources[0].label}):`)
    for (const s of diverging) {
      console.error(`  - ${s.label}: ${s.version} (attendu ${reference})`)
    }
    process.exit(1)
  }

  console.log(`\n[OK] Toutes les versions sont alignees sur ${reference}.`)
}

main()
