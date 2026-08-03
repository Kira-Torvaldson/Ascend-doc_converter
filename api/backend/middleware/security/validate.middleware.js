'use strict'

const { ZodError } = require('zod')
const { buildRouteError } = require('../../src/utils/error-envelope.js')

/**
 * Validate req.{params,query,body} with Zod schemas before reaching handlers.
 * Validation failures return the standardized error envelope (code, category,
 * hint) with Zod issues in error.details, consistent with conversion routes.
 * @param {{ params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, body?: import('zod').ZodTypeAny }} schemas
 */
function validate(schemas) {
  return function validateMiddleware(req, res, next) {
    try {
      if (schemas && schemas.params) req.params = schemas.params.parse(req.params)
      if (schemas && schemas.query) req.query = schemas.query.parse(req.query)
      if (schemas && schemas.body) req.body = schemas.body.parse(req.body)
      return next()
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message
        }))
        const message = issues.length > 0
          ? `Invalid request: ${issues.map((i) => `${i.path || 'body'} (${i.message})`).join('; ')}`
          : 'Invalid request'
        return res.status(400).json({
          success: false,
          error: buildRouteError('INVALID_INPUT', message, { issues }),
          detail: message
        })
      }
      return next(err)
    }
  }
}

module.exports = { validate }

