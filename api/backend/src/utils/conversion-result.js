/**
 * Centralized builders for standardized ConversionResult objects.
 * This module intentionally applies only structural defaults and minimal
 * semantic guarantees defined by the contract.
 */

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMeta(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function createSuccessResult(payload) {
  const input = payload || {};

  return {
    success: true,
    conversionId: input.conversionId,
    converter: input.converter,
    pipeline: normalizeArray(input.pipeline),
    inputFormat: input.inputFormat,
    outputFormat: input.outputFormat,
    inputFile: input.inputFile,
    outputFile: input.outputFile,
    durationMs: input.durationMs,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    warnings: normalizeArray(input.warnings),
    logs: normalizeArray(input.logs),
    error: null,
    meta: normalizeMeta(input.meta),
  };
}

function createFailureResult(payload) {
  const input = payload || {};

  if (!input.error || typeof input.error !== "object" || Array.isArray(input.error)) {
    throw new TypeError("createFailureResult requires a non-null error object.");
  }

  return {
    success: false,
    conversionId: input.conversionId,
    converter: input.converter,
    pipeline: normalizeArray(input.pipeline),
    inputFormat: input.inputFormat,
    outputFormat: input.outputFormat,
    inputFile: input.inputFile,
    outputFile: input.outputFile ?? null,
    durationMs: input.durationMs,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    warnings: normalizeArray(input.warnings),
    logs: normalizeArray(input.logs),
    error: input.error,
    meta: normalizeMeta(input.meta),
  };
}

module.exports = {
  createSuccessResult,
  createFailureResult,
};
