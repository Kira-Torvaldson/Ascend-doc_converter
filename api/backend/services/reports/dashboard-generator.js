'use strict'

/**
 * Génère dashboard.html à partir de history.json (format épuré summary + details).
 * Tableau résumé : Document | Version | Statut | Round-trip | Blocs | Images | Date/Heure.
 * Section détaillée (collapsible) par ligne ayant des erreurs.
 * Couleurs : vert = succès, rouge = échec, orange = warning.
 * Filtres et tri par date, document, statut, type d'erreur.
 */

const path = require('path')
const fs = require('fs')
const { loadHistory, getReportsDir } = require('./history-manager.js')

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function statusBadge(status) {
  if (status === 'success') return '<span class="badge success">✅ success</span>'
  if (status === 'conversion_failed' || status === 'input_invalid') return '<span class="badge fail">❌ échec</span>'
  return '<span class="badge warning">⚠️ ' + escapeHtml(status || 'no_output') + '</span>'
}

function roundTripBadge(match) {
  return match ? '<span class="rt ok">✅ OK</span>' : '<span class="rt ko">❌ Diff</span>'
}

/**
 * Construit une map version -> details pour accès rapide
 */
function detailsByVersion(details) {
  const m = {}
  for (const d of details || []) {
    const k = String(d.document) + '::' + d.version
    m[k] = d
  }
  return m
}

function formatTimestamp(ts) {
  if (!ts) return '-'
  try {
    const d = new Date(ts)
    if (!isNaN(d.getTime())) return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })
  } catch (_) {}
  return ts
}

/**
 * @param {string} [reportsDir]
 * @returns {string} chemin du fichier dashboard écrit
 */
function generateDashboard(reportsDir) {
  const dir = getReportsDir(reportsDir)
  const historyPath = path.join(dir, 'history.json')
  const outPath = path.join(dir, 'dashboard.html')

  let summary = []
  let details = []
  if (fs.existsSync(historyPath)) {
    try {
      const h = loadHistory(dir)
      summary = h.summary || []
      details = h.details || []
    } catch (_) {}
  }

  const detailMap = detailsByVersion(details)

  const rows = summary.map((s, i) => {
    const key = String(s.document) + '::' + s.version
    const det = detailMap[key]
    const hasDetails = !!det && Array.isArray(det.errors) && det.errors.length > 0
    const ts = s.timestamp ? formatTimestamp(s.timestamp) : '-'
    const detailId = 'detail-' + i
    let detailHtml = ''
    if (hasDetails) {
      const errList = det.errors
        .map(
          (x) =>
            `<div class="err severity-${escapeHtml(x.severity || '')}"><strong>${escapeHtml(x.type)}</strong> [${escapeHtml(x.severity)}] ${escapeHtml(x.description)}</div>`
        )
        .join('')
      const files = [det.output_md, det.output_adoc].filter(Boolean)
      const filesLine = files.length ? `<p class="files">Fichiers : ${files.map((f) => escapeHtml(f)).join(', ')}</p>` : ''
      detailHtml = `
        <div class="detail-panel" id="${detailId}" aria-hidden="true">
          <h4>Détails des erreurs</h4>
          ${errList}
          ${filesLine}
        </div>`
    }
    return `
    <tr class="entry ${s.status}" data-index="${i}" data-version="${s.version}" data-doc="${escapeHtml(s.document)}" data-status="${escapeHtml(s.status)}" data-rt="${s.round_trip_match ? 'ok' : 'ko'}" data-ts="${escapeHtml(s.timestamp || '')}">
      <td>${escapeHtml(s.document || '-')}</td>
      <td>${s.version}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${roundTripBadge(s.round_trip_match)}</td>
      <td>${s.blocks_detected ?? 0}</td>
      <td>${s.images_detected ?? 0}</td>
      <td>${escapeHtml(ts)}</td>
      <td class="toggle-cell">${hasDetails ? '<button type="button" class="toggle-detail" data-detail="' + detailId + '" aria-expanded="false">Détails</button>' : '—'}</td>
    </tr>
    ${hasDetails ? '<tr class="detail-row"><td colspan="8">' + detailHtml + '</td></tr>' : ''}`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Ascend – Historique des conversions round-trip</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 1.5rem; background: #1a1b26; color: #c0caf5; }
    h1 { margin-top: 0; }
    .filters { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
    .filters label { display: flex; align-items: center; gap: 0.5rem; }
    .filters input, .filters select { padding: 0.4rem; border-radius: 6px; border: 1px solid #565f89; background: #24283b; color: #c0caf5; }
    table { width: 100%; border-collapse: collapse; background: #24283b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid #363b54; }
    th { background: #363b54; font-weight: 600; }
    tr.entry { cursor: default; }
    tr.entry:hover { background: #2a2e42; }
    tr.entry.success { border-left: 3px solid #9ece6a; }
    tr.entry.conversion_failed, tr.entry.input_invalid { border-left: 3px solid #f7768e; }
    tr.entry.no_output, tr.entry.warning { border-left: 3px solid #e0af68; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .badge.success { background: #3d5a22; color: #9ece6a; }
    .badge.fail { background: #8b3a3a; color: #f7768e; }
    .badge.warning { background: #6d5c1c; color: #e0af68; }
    .rt.ok { color: #9ece6a; }
    .rt.ko { color: #f7768e; }
    .detail-row { background: #1a1b26; }
    .detail-row td { padding: 0.6rem 1rem; vertical-align: top; border-bottom: 1px solid #363b54; }
    .detail-panel { padding: 0.5rem 0; font-size: 0.9rem; }
    .detail-panel[aria-hidden="true"] { display: none; }
    .detail-panel h4 { margin: 0 0 0.5rem 0; font-size: 0.95rem; }
    .err { margin: 0.3rem 0; }
    .err.severity-critical { color: #f7768e; }
    .err.severity-warning { color: #e0af68; }
    .files { margin-top: 0.5rem; font-size: 0.85rem; color: #a9b1d6; }
    .toggle-detail { padding: 0.2rem 0.5rem; cursor: pointer; border-radius: 4px; border: 1px solid #565f89; background: #24283b; color: #c0caf5; font-size: 0.85rem; }
    .toggle-detail:hover { background: #363b54; }
    .toggle-detail[aria-expanded="true"] { background: #565f89; }
  </style>
</head>
<body>
  <h1>Historique des conversions round-trip AsciiDoc ↔ Markdown</h1>
  <div class="filters">
    <label>Statut <select id="filterStatus"><option value="">Tous</option><option value="success">✅ success</option><option value="conversion_failed">❌ échec</option><option value="no_output">⚠️ no_output</option></select></label>
    <label>Document <input type="text" id="filterDoc" placeholder="Filtrer par nom..."></label>
    <label>Date <input type="date" id="filterDate"></label>
    <label>Round-trip <select id="filterRt"><option value="">Tous</option><option value="ok">✅ OK</option><option value="ko">❌ Diff</option></select></label>
    <label>Tri <select id="sortBy"><option value="date-desc">Date (récent d'abord)</option><option value="date-asc">Date (ancien d'abord)</option><option value="doc">Document</option><option value="version">Version</option></select></label>
  </div>
  <table>
    <thead>
      <tr>
        <th>Document</th>
        <th>Version</th>
        <th>Statut</th>
        <th>Round-trip</th>
        <th>Blocs</th>
        <th>Images</th>
        <th>Date/Heure</th>
        <th>Détails</th>
      </tr>
    </thead>
    <tbody>
${rows || '<tr><td colspan="8">Aucune conversion enregistrée.</td></tr>'}
    </tbody>
  </table>
  <script>
    (function(){
      var summary = ${JSON.stringify(summary)};
      var details = ${JSON.stringify(details)};
      var detailMap = {};
      details.forEach(function(d){ detailMap[(d.document||'') + '::' + d.version] = d; });
      var rows = document.querySelectorAll('tr.entry');
      var detailRows = document.querySelectorAll('tr.detail-row');
      document.querySelectorAll('.toggle-detail').forEach(function(btn){
        btn.addEventListener('click', function(ev){
          ev.stopPropagation();
          var id = this.getAttribute('data-detail');
          var panel = id ? document.getElementById(id) : null;
          if (!panel) return;
          var hidden = panel.getAttribute('aria-hidden') !== 'false';
          panel.setAttribute('aria-hidden', hidden ? 'false' : 'true');
          this.setAttribute('aria-expanded', hidden ? 'true' : 'false');
          this.textContent = hidden ? 'Masquer' : 'Détails';
        });
      });
      function applyFilters(){
        var st = (document.getElementById('filterStatus')||{}).value;
        var doc = ((document.getElementById('filterDoc')||{}).value||'').toLowerCase();
        var dt = (document.getElementById('filterDate')||{}).value;
        var rt = (document.getElementById('filterRt')||{}).value;
        rows.forEach(function(r){
          var i = parseInt(r.getAttribute('data-index'), 10);
          var e = summary[i] || {};
          var show = true;
          if (st && e.status !== st) show = false;
          if (doc && (e.document||'').toLowerCase().indexOf(doc) === -1) show = false;
          if (dt && (e.timestamp||'').slice(0,10) !== dt) show = false;
          if (rt === 'ok' && !e.round_trip_match) show = false;
          if (rt === 'ko' && e.round_trip_match) show = false;
          r.style.display = show ? '' : 'none';
          var next = r.nextElementSibling;
          if (next && next.classList.contains('detail-row')) next.style.display = show ? '' : 'none';
        });
      }
      function applySort(){
        var v = (document.getElementById('sortBy')||{}).value || 'date-desc';
        var tbody = document.querySelector('table tbody');
        if (!tbody || !summary.length) return;
        var indices = summary.map(function(_, i){ return i; });
        if (v === 'date-desc') indices.sort(function(a,b){ return (summary[b].timestamp||'').localeCompare(summary[a].timestamp||''); });
        else if (v === 'date-asc') indices.sort(function(a,b){ return (summary[a].timestamp||'').localeCompare(summary[b].timestamp||''); });
        else if (v === 'doc') indices.sort(function(a,b){ return (summary[a].document||'').localeCompare(summary[b].document||''); });
        else if (v === 'version') indices.sort(function(a,b){ return (summary[a].version||0) - (summary[b].version||0); });
        var frag = document.createDocumentFragment();
        indices.forEach(function(i){
          var tr = tbody.querySelector('tr.entry[data-index="' + i + '"]');
          if (tr) { frag.appendChild(tr); var dr = tr.nextElementSibling; if (dr && dr.classList.contains('detail-row')) frag.appendChild(dr); }
        });
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        tbody.appendChild(frag);
      }
      ['filterStatus','filterDoc','filterDate','filterRt'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
        if (el && id === 'filterDoc') el.addEventListener('input', applyFilters);
      });
      var sortEl = document.getElementById('sortBy');
      if (sortEl) sortEl.addEventListener('change', applySort);
    })();
  </script>
</body>
</html>`

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(outPath, html, 'utf8')
  return outPath
}

module.exports = { generateDashboard }
