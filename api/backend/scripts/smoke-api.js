'use strict'

const tests = [
  ['GET', 'http://localhost:3003/api/confirmation/stats', null],
  ['POST', 'http://localhost:3003/api/to-markdown', { text: '= Smoke\n\nOK' }],
  ['POST', 'http://localhost:3003/api/to-asciidoc', { text: '# Smoke\n\nOK' }],
  ['POST', 'http://localhost:3003/api/text-to-markdown', { text: 'a\nb' }],
  ['POST', 'http://localhost:3003/api/from-html', { text: '<h2>Smoke</h2>', to: 'markdown' }],
]

async function run () {
  let hasFailure = false

  for (const [method, url, body] of tests) {
    const start = Date.now()
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const elapsed = Date.now() - start
      const content = await response.text()

      console.log(
        JSON.stringify({
          method,
          url,
          status: response.status,
          latency_ms: elapsed,
          preview: content.slice(0, 80).replace(/\n/g, ' '),
        })
      )

      if (!response.ok) hasFailure = true
    } catch (error) {
      hasFailure = true
      console.log(
        JSON.stringify({
          method,
          url,
          status: 'ERROR',
          latency_ms: Date.now() - start,
          error: error.message || String(error),
        })
      )
    }
  }

  if (hasFailure) {
    process.exitCode = 1
  }
}

run()
