import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convertAsciiDocToMarkdown } from './asciidoc-to-markdown'

function okResponse(body: any) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as any
}

function errorResponse(status: number, body: any) {
  return {
    ok: false,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as any
}

describe('Step 10 wrapper: convertAsciiDocToMarkdown', () => {
  const setStatus = vi.fn()
  const setOutput = vi.fn()
  const setLoading = vi.fn()
  const setNotification = vi.fn()
  const setShowErrorModal = vi.fn()
  const setErrorMessage = vi.fn()
  const setBackendConversionResult = vi.fn()
  const setConversionUiState = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    setStatus.mockReset()
    setOutput.mockReset()
    setLoading.mockReset()
    setNotification.mockReset()
    setShowErrorModal.mockReset()
    setErrorMessage.mockReset()
    setBackendConversionResult.mockReset()
    setConversionUiState.mockReset()
  })

  afterEach(() => {
    ;(globalThis as any).fetch = undefined
  })

  it('uses backend success ConversionResult as source of truth', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      okResponse({
        markdown: '# Title',
        conversionResult: {
          success: true,
          conversionId: 'c10',
          converter: 'downdoc',
          pipeline: ['asciidoc->markdown'],
          inputFormat: 'asciidoc',
          outputFormat: 'markdown',
          inputFile: { originalName: 'input.adoc' },
          outputFile: { originalName: 'output.md' },
          durationMs: 12,
          startedAt: '2026-01-01T00:00:00.000Z',
          finishedAt: '2026-01-01T00:00:00.012Z',
          warnings: [],
          logs: [],
          error: null,
          meta: { route: '/api/to-markdown' },
        },
      })
    )

    const result = await convertAsciiDocToMarkdown(
      '= Title',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        error: null,
        conversionId: 'c10',
      })
    )
    expect(setBackendConversionResult).toHaveBeenCalledWith(null)
    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, conversionId: 'c10', error: null })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('success')
    expect(setOutput).toHaveBeenLastCalledWith('# Title')
  })

  it('uses backend failure ConversionResult as source of truth and preserves error.code', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      errorResponse(500, {
        success: false,
        conversionId: 'f10',
        converter: 'downdoc',
        pipeline: ['asciidoc->markdown'],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: { originalName: 'input.adoc' },
        outputFile: null,
        durationMs: 7,
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: '2026-01-01T00:00:00.007Z',
        warnings: [],
        logs: [],
        error: { code: 'CONVERSION_FAILED', message: 'Downstream failure', details: { stage: 'module' } },
        meta: { route: '/api/to-markdown' },
        detail: 'Downstream failure',
      })
    )

    const result = await convertAsciiDocToMarkdown(
      '= Title',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        conversionId: 'f10',
        error: expect.objectContaining({ code: 'CONVERSION_FAILED', message: 'Downstream failure' }),
      })
    )
    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED' }),
      })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('does not treat HTTP 200 as success when conversionResult is missing', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      okResponse({
        markdown: '# Title',
      })
    )

    const result = await convertAsciiDocToMarkdown(
      '= Title',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      undefined,
      undefined,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setOutput).not.toHaveBeenCalled()
  })
})

