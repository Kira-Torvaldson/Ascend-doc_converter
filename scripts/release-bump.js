'use strict'

/**
 * ASC-001 — Release version bump
 *
 * Met a jour la version Ascend (0.0.1.4.x) de maniere coherente dans toutes
 * les zones declarees (frontend/backend packages, lockfiles, README, changelog, UI).
 *
 * Usage:
 *   node scripts/release-bump.js <new-version> [--dry-run]
 *
 * Exemples:
 *   node scripts/release-bump.js 0.0.1.4.8
 *   node scripts/release-bump.js 0.0.1.4.8 --dry-run
 *
 * Ne modifie PAS:
 *   - package.json racine (paquet "downdoc", versionne independamment)
 *   - npm/version.js / CHANGELOG.adoc (heritage downdoc)
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

const VERSION_PATTERN = /^\d+(\.\d+)+$/

const FILES = {
  frontendPkg: path.join(ROOT, 'api/frontend/package.json'),
  backendPkg: path.join(ROOT, 'api/backend/package.json'),
  frontendLock: path.join(ROOT, 'api/frontend/package-lock.json'),
  backendLock: path.join(ROOT, 'api/backend/package-lock.json'),
  readme: path.join(ROOT, 'README.md'),
  changelog: path.join(ROOT, 'changelog.md'),
  appTsx: path.join(ROOT, 'api/frontend/src/App.tsx')
}

function fail(message) {
  console.error(`[ERROR] ${message}`)
  process.exit(1)
}

function readFile(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch (err) {
    fail(`Lecture impossible: ${file} (${err.message})`)
  }
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFile(FILES.backendPkg))
  if (!pkg.version) fail('Version courante introuvable dans api/backend/package.json')
  return pkg.version
}

function todayIso() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Applique une transformation a un fichier et retourne un descriptif de changement.
 * transform(content) -> { content, count }
 */
function planChange(label, file, transform) {
  const before = readFile(file)
  const { content: after, count } = transform(before)
  return { label, file, before, after, count, changed: before !== after }
}

function replaceVersionFields(content, oldVersion, newVersion) {
  // Remplace uniquement les occurrences "<oldVersion>" entre guillemets (champs version JSON).
  const re = new RegExp(`"${escapeRegExp(oldVersion)}"`, 'g')
  let count = 0
  const out = content.replace(re, () => {
    count += 1
    return `"${newVersion}"`
  })
  return { content: out, count }
}

function buildPlan(oldVersion, newVersion) {
  const date = todayIso()
  const plan = []

  // 1 & 2: package.json front/back (champ version racine du JSON)
  for (const [label, file] of [['frontend package.json', FILES.frontendPkg], ['backend package.json', FILES.backendPkg]]) {
    plan.push(planChange(label, file, (content) => {
      const re = new RegExp(`("version"\\s*:\\s*)"${escapeRegExp(oldVersion)}"`)
      let count = 0
      const out = content.replace(re, (m, p1) => {
        count += 1
        return `${p1}"${newVersion}"`
      })
      return { content: out, count }
    }))
  }

  // 3 & 4: lockfiles (2 occurrences chacun)
  for (const [label, file] of [['frontend package-lock.json', FILES.frontendLock], ['backend package-lock.json', FILES.backendLock]]) {
    plan.push(planChange(label, file, (content) => replaceVersionFields(content, oldVersion, newVersion)))
  }

  // 5: README badge + Latest changes
  plan.push(planChange('README.md', FILES.readme, (content) => {
    let count = 0
    let out = content.replace(new RegExp(`version-${escapeRegExp(oldVersion)}-orange`, 'g'), () => {
      count += 1
      return `version-${newVersion}-orange`
    })
    out = out.replace(new RegExp(`Latest changes \\(v${escapeRegExp(oldVersion)}\\)`, 'g'), () => {
      count += 1
      return `Latest changes (v${newVersion})`
    })
    return { content: out, count }
  }))

  // 6: changelog — insertion d'une nouvelle entree apres "## Version History"
  plan.push(planChange('changelog.md', FILES.changelog, (content) => {
    if (content.includes(`### ${newVersion} (`)) {
      return { content, count: 0 } // entree deja presente
    }
    // Tolerant aux fins de ligne LF et CRLF.
    const markerMatch = content.match(/##\s+Version History\r?\n/)
    if (!markerMatch) return { content, count: 0 }
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const insertAt = markerMatch.index + markerMatch[0].length
    const entryLines = [
      '',
      `### ${newVersion} (${date})`,
      '',
      '#### Changed',
      '- Release alignment update for frontend/backend package versions, lockfiles, README badge, and displayed app metadata.',
      ''
    ]
    const entry = entryLines.join(eol)
    const out = content.slice(0, insertAt) + entry + content.slice(insertAt)
    return { content: out, count: 1 }
  }))

  // 7: App.tsx — label "Nouveautes v..."
  plan.push(planChange('api/frontend/src/App.tsx', FILES.appTsx, (content) => {
    let count = 0
    const out = content.replace(new RegExp(`Nouveautés v${escapeRegExp(oldVersion)}`, 'g'), () => {
      count += 1
      return `Nouveautés v${newVersion}`
    })
    return { content: out, count }
  }))

  return plan
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const newVersion = args.find((a) => !a.startsWith('--'))

  if (!newVersion) fail('Version cible manquante. Usage: node scripts/release-bump.js <new-version> [--dry-run]')
  if (!VERSION_PATTERN.test(newVersion)) fail(`Format de version invalide: "${newVersion}" (attendu: chiffres separes par des points, ex 0.0.1.4.8)`)

  const oldVersion = getCurrentVersion()
  if (oldVersion === newVersion) fail(`La version cible est identique a la version courante (${oldVersion}).`)

  console.log(`[INFO] Bump ${oldVersion} -> ${newVersion}${dryRun ? ' (DRY-RUN)' : ''}`)

  const plan = buildPlan(oldVersion, newVersion)

  let totalChanged = 0
  for (const item of plan) {
    const status = item.changed ? `MAJ (${item.count} remplacement${item.count > 1 ? 's' : ''})` : 'inchange'
    console.log(`  - ${item.label}: ${status}`)
    if (item.changed) totalChanged += 1
  }

  if (totalChanged === 0) {
    console.log('[WARN] Aucun changement applicable. Verifie la version courante et les fichiers.')
    process.exit(1)
  }

  if (dryRun) {
    console.log(`[OK] DRY-RUN: ${totalChanged} fichier(s) seraient modifies. Aucune ecriture effectuee.`)
    return
  }

  for (const item of plan) {
    if (item.changed) fs.writeFileSync(item.file, item.after)
  }

  console.log(`[OK] ${totalChanged} fichier(s) mis a jour vers ${newVersion}.`)
  console.log('[INFO] Verifie ensuite: node scripts/check-version-sync.js')
}

main()
