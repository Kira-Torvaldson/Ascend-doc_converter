'use strict'

const { ZodError } = require('zod')

/**
 * Validate req.{params,query,body} with Zod schemas before reaching handlers.
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
        return res.status(400).json({
          error: 'Invalid request',
          issues: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message
          }))
        })
      }
      return next(err)
    }
  }
}

module.exports = { validate }

