#!/usr/bin/env node

/**
 * Script to list and display conversion logs
 * Usage: node list-logs.js [conversionId]
 */

const fs = require('fs')
const path = require('path')

const LOGS_DIR = path.join(__dirname)

function listLogs() {
  try {
    // Verify logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      console.error(`❌ Le dossier logs n'existe pas: ${LOGS_DIR}`)
      console.log(`   Le dossier sera créé automatiquement lors de la première conversion.`)
      console.log(`   Chemin attendu: ${LOGS_DIR}`)
      return
    }

    // Verify directory is readable
    try {
      fs.accessSync(LOGS_DIR, fs.constants.R_OK)
    } catch (accessError) {
      console.error(`❌ Le dossier logs n'est pas accessible en lecture: ${LOGS_DIR}`)
      return
    }

    const files = fs.readdirSync(LOGS_DIR)
    const logFiles = files
      .filter(file => file.endsWith('.log') && !file.startsWith('.'))
      .map(file => {
        const filePath = path.join(LOGS_DIR, file)
        
        // Verify file exists and is readable
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️  Fichier introuvable: ${file}`)
          return null
        }
        
        const stats = fs.statSync(filePath)
        
        // Verify file is not empty
        if (stats.size === 0) {
          console.warn(`⚠️  Fichier vide: ${file}`)
          return null
        }
        
        let content, log
        try {
          content = fs.readFileSync(filePath, 'utf8')
          log = JSON.parse(content)
          
          // Verify log structure
          if (!log.conversionId) {
            console.warn(`⚠️  Format de log invalide (pas de conversionId): ${file}`)
            return null
          }
        } catch (parseError) {
          console.warn(`⚠️  Erreur de parsing JSON pour ${file}: ${parseError.message}`)
          return null
        }
        
        return {
          filename: file,
          conversionId: log.conversionId,
          status: log.status || 'unknown',
          sourceFormat: log.formats?.source || 'unknown',
          targetFormat: log.formats?.target || 'unknown',
          duration: log.execution?.totalDuration || null,
          steps: log.execution?.steps?.length || 0,
          createdAt: log.timestamp?.start || stats.birthtime.toISOString(),
          size: stats.size
        }
      })
      .filter(log => log !== null) // Remove null entries from failed parsing
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (logFiles.length === 0) {
      console.log('📋 Aucun log trouvé dans le dossier logs/')
      console.log(`   Dossier vérifié: ${LOGS_DIR}`)
      console.log('   Les logs seront créés automatiquement lors des conversions.')
      console.log('   Pour tester, effectuez une conversion via l\'interface web ou l\'API.')
      return
    }

    console.log(`📋 ${logFiles.length} log(s) trouvé(s):\n`)
    
    logFiles.forEach((log, index) => {
      const statusIcon = log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⏳'
      const statusColor = log.status === 'success' ? '\x1b[32m' : log.status === 'error' ? '\x1b[31m' : '\x1b[33m'
      const resetColor = '\x1b[0m'
      
      console.log(`${index + 1}. ${statusColor}${statusIcon}${resetColor} ${log.conversionId}`)
      console.log(`   Format: ${log.sourceFormat} → ${log.targetFormat}`)
      console.log(`   Statut: ${log.status}`)
      console.log(`   Durée: ${log.duration ? log.duration + 's' : 'N/A'}`)
      console.log(`   Étapes: ${log.steps}`)
      console.log(`   Créé: ${new Date(log.createdAt).toLocaleString('fr-FR')}`)
      console.log(`   Taille: ${(log.size / 1024).toFixed(2)} KB`)
      console.log(`   Fichier: ${log.filename}\n`)
    })
  } catch (error) {
    console.error('❌ Erreur lors de la lecture des logs:', error.message)
  }
}

function showLog(conversionId) {
  try {
    // Verify logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      console.error(`❌ Le dossier logs n'existe pas: ${LOGS_DIR}`)
      console.log(`   Le dossier sera créé automatiquement lors de la première conversion.`)
      return
    }

    const logFilePath = path.join(LOGS_DIR, `${conversionId}.log`)
    
    if (!fs.existsSync(logFilePath)) {
      console.error(`❌ Log non trouvé: ${conversionId}.log`)
      console.log(`   Vérifiez que le fichier existe dans: ${LOGS_DIR}`)
      
      // List available logs to help user
      const files = fs.readdirSync(LOGS_DIR)
      const availableLogs = files.filter(file => file.endsWith('.log'))
      if (availableLogs.length > 0) {
        console.log(`\n   Logs disponibles dans le dossier:`)
        availableLogs.slice(0, 5).forEach(file => {
          const id = file.replace('.log', '')
          console.log(`   - ${id}`)
        })
        if (availableLogs.length > 5) {
          console.log(`   ... et ${availableLogs.length - 5} autre(s)`)
        }
      }
      return
    }

    // Verify file is not empty
    const stats = fs.statSync(logFilePath)
    if (stats.size === 0) {
      console.error(`❌ Le fichier de log est vide: ${conversionId}.log`)
      return
    }

    let content, log
    try {
      content = fs.readFileSync(logFilePath, 'utf8')
      log = JSON.parse(content)
      
      // Verify log structure
      if (!log.conversionId) {
        console.error(`❌ Format de log invalide: le fichier ne contient pas de conversionId`)
        return
      }
    } catch (parseError) {
      console.error(`❌ Erreur de parsing JSON: ${parseError.message}`)
      console.log(`   Le fichier existe mais n'est pas un JSON valide.`)
      return
    }

    console.log(`\n📄 Log de conversion: ${log.conversionId}\n`)
    console.log('═'.repeat(60))
    console.log(`Format: ${log.formats.source} → ${log.formats.target}`)
    console.log(`Statut: ${log.status}`)
    console.log(`Début: ${new Date(log.timestamp.start).toLocaleString('fr-FR')}`)
    if (log.timestamp.end) {
      console.log(`Fin: ${new Date(log.timestamp.end).toLocaleString('fr-FR')}`)
    }
    console.log(`Durée totale: ${log.execution.totalDuration || 'N/A'}s`)
    console.log(`Modules exécutés: ${log.execution.modulesExecuted.join(', ')}`)
    console.log('═'.repeat(60))

    if (log.execution.steps.length > 0) {
      console.log('\n📋 Étapes d\'exécution:\n')
      log.execution.steps.forEach((step, index) => {
        const stepIcon = step.status === 'success' ? '✓' : '✗'
        console.log(`  ${index + 1}. ${stepIcon} ${step.module}`)
        console.log(`     ${step.fromFormat} → ${step.toFormat}`)
        console.log(`     Durée: ${step.duration}s`)
        if (step.error) {
          console.log(`     Erreur: ${step.error}`)
        }
        console.log('')
      })
    }

    if (log.files) {
      console.log('📁 Fichiers:\n')
      if (log.files.input) {
        console.log(`  Entrée: ${log.files.input}`)
      }
      if (log.files.output) {
        console.log(`  Sortie: ${log.files.output}`)
      }
      if (log.files.intermediate && log.files.intermediate.length > 0) {
        console.log(`  Intermédiaires: ${log.files.intermediate.length} fichier(s)`)
      }
      console.log('')
    }

    if (log.error) {
      console.log('❌ Erreur:\n')
      console.log(`  ${log.error}\n`)
    }

    if (log.logs && log.logs.length > 0) {
      console.log('📝 Messages de log:\n')
      log.logs.slice(-10).forEach(logEntry => {
        const level = logEntry.level || 'info'
        const icon = level === 'error' ? '✗' : level === 'warn' ? '⚠' : 'ℹ'
        console.log(`  ${icon} [${level.toUpperCase()}] ${logEntry.message}`)
      })
      if (log.logs.length > 10) {
        console.log(`  ... et ${log.logs.length - 10} autre(s) message(s)`)
      }
      console.log('')
    }

    console.log('═'.repeat(60))
    console.log(`\n💡 Pour voir le log complet en JSON:`)
    console.log(`   cat ${logFilePath}`)
    console.log(`   ou`)
    console.log(`   curl http://localhost:3003/api/logs/${log.conversionId}\n`)
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du log:', error.message)
  }
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  listLogs()
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log('Usage:')
  console.log('  node list-logs.js              # Liste tous les logs')
  console.log('  node list-logs.js <conversionId>  # Affiche un log spécifique')
  console.log('  node list-logs.js --help      # Affiche cette aide')
} else {
  showLog(args[0])
}
