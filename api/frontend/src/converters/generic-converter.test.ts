import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { convertText } from './generic-converter'

function makeOkResponse(body: any) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as any
}

function makeErrorResponse(status: number, body: any) {
  return {
    ok: false,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as any
}

describe('convertText (success consumption)', () => {
  const setStatus = vi.fn()
  const setOutput = vi.fn()
  const setLoading = vi.fn()
  const setNotification = vi.fn()
  const setBackendConversionResult = vi.fn()
  const setConversionUiState = vi.fn()
  const setShowErrorModal = vi.fn()
  const setErrorMessage = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    setStatus.mockReset()
    setOutput.mockReset()
    setLoading.mockReset()
    setNotification.mockReset()
    setBackendConversionResult.mockReset()
    setConversionUiState.mockReset()
    setShowErrorModal.mockReset()
    setErrorMessage.mockReset()
  })

  afterEach(() => {
    ;(globalThis as any).fetch = undefined
  })

  it('passes frontend end-to-end success flow for migrated path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# Title',
        conversionResult: { success: true, conversionId: 'c1', error: null },
      })
    )
    ;(globalThis as any).fetch = fetchMock

    await convertText(
      '= Title',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [endpoint, fetchOptions] = fetchMock.mock.calls[0]
    expect(endpoint).toContain('/api/to-markdown')
    expect(fetchOptions.method).toBe('POST')

    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('success')
    expect(setShowErrorModal).toHaveBeenCalledWith(false)
    expect(setErrorMessage).toHaveBeenCalledWith('')
    expect(setNotification).toHaveBeenCalledWith(null)
    expect(setBackendConversionResult).toHaveBeenCalledWith(null) // cleared at start
    expect(setBackendConversionResult).toHaveBeenCalledWith({ success: true, conversionId: 'c1', error: null })
    expect(setOutput).toHaveBeenCalledWith('# Title')
  })

  it('does not treat success as valid if conversionResult indicates failure', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# Title',
        conversionResult: { success: false, error: { code: 'CONVERSION_FAILED', message: 'nope' } },
      })
    )

    await convertText(
      '= Title',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      undefined,
      undefined,
      setBackendConversionResult,
      setConversionUiState
    )

    // It should treat it as a structured failure and not render output as a success result.
    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED', message: 'nope' }),
      })
    )
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: expect.stringContaining('CONVERSION_FAILED'),
      })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('preserves structured failure semantics when HTTP 200 carries conversionResult.success=false (markdown->asciidoc)', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        asciidoc: '= Should not be used',
        conversionResult: {
          success: false,
          error: { code: 'CONVERSION_FAILED', message: 'Pandoc conversion failed' },
        },
      })
    )

    await convertText(
      '# Title',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED' }),
      })
    )
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('clears stale output on non-structured HTTP error for migrated markdown->asciidoc flow', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        detail: 'Internal server error without structured payload',
      })
    )

    await convertText(
      '# Source',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setOutput).toHaveBeenCalledWith('')
    expect(setBackendConversionResult).toHaveBeenCalledWith(null)
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('consumes structured failed ConversionResult on HTTP failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'Conversion failed',
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Output appears to be AsciiDoc instead of Markdown',
        },
      })
    )
    ;(globalThis as any).fetch = fetchMock

    await convertText(
      '= Title',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [endpoint, fetchOptions] = fetchMock.mock.calls[0]
    expect(endpoint).toContain('/api/to-markdown')
    expect(fetchOptions.method).toBe('POST')
    expect(setBackendConversionResult).toHaveBeenCalledWith(null)
    expect(setNotification).toHaveBeenCalledWith(null)
    expect(setShowErrorModal).toHaveBeenCalledWith(false)
    expect(setErrorMessage).toHaveBeenCalledWith('')
    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CONVERSION_FAILED',
        }),
      })
    )
    // stale success clear for migrated path
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setShowErrorModal).toHaveBeenCalledWith(true)
    expect(setErrorMessage).toHaveBeenCalledWith('Output appears to be AsciiDoc instead of Markdown')
    expect(setNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('CONVERSION_FAILED'),
        type: 'error',
      })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('handles empty input without starting a request', async () => {
    const fetchMock = vi.fn()
    ;(globalThis as any).fetch = fetchMock

    await convertText(
      '   ',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(setStatus).toHaveBeenCalledWith('Veuillez entrer du texte à convertir')
    expect(setLoading).not.toHaveBeenCalled()
    expect(setConversionUiState).not.toHaveBeenCalled()
    expect(setOutput).not.toHaveBeenCalled()
  })

  it('preserves structured failure semantics for non-modal failure code', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'Invalid input file',
        error: {
          code: 'INVALID_INPUT',
          message: 'Input file not found',
          details: { reason: 'missing file' },
        },
      })
    )

    await convertText(
      '= Title',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
          message: 'Input file not found',
        }),
      })
    )
    // For non-modal code, keep modal closed while still exposing structured code in notification.
    expect(setShowErrorModal).toHaveBeenCalledWith(false)
    expect(setNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('INVALID_INPUT'),
        type: 'error',
      })
    )
    // stale success clear for migrated path still applies
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('keeps backend semantics coherent at effective UI output boundary (success then failure)', async () => {
    const ui = {
      output: 'OLD_SUCCESS',
      status: '',
      notification: null as null | { message: string; type: 'success' | 'error'; visible: boolean },
      showErrorModal: false,
      errorMessage: '',
      conversionUiState: 'idle' as 'idle' | 'loading' | 'success' | 'error',
      backendResult: null as any,
    }

    const setStatusState = (s: string) => { ui.status = s }
    const setOutputState = (s: string) => { ui.output = s }
    const setLoadingState = (_: boolean) => {}
    const setNotificationState = (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => {
      ui.notification = n
    }
    const setShowErrorModalState = (v: boolean) => { ui.showErrorModal = v }
    const setErrorMessageState = (m: string) => { ui.errorMessage = m }
    const setBackendResultState = (r: any | null) => { ui.backendResult = r }
    const setUiState = (s: 'idle' | 'loading' | 'success' | 'error') => { ui.conversionUiState = s }

    // Attempt 1: coherent success
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# Fresh output',
        conversionResult: { success: true, conversionId: 'attempt-1', error: null },
      })
    )
    await convertText(
      '= Title',
      'asciidoc',
      'markdown',
      setStatusState,
      setOutputState,
      setLoadingState,
      setNotificationState,
      {},
      null,
      setShowErrorModalState,
      setErrorMessageState,
      setBackendResultState,
      setUiState
    )

    expect(ui.conversionUiState).toBe('success')
    expect(ui.output).toBe('# Fresh output')
    expect(ui.showErrorModal).toBe(false)
    expect(ui.notification?.type).toBe('success')
    expect(ui.backendResult).toEqual(expect.objectContaining({ success: true, conversionId: 'attempt-1' }))

    // Attempt 2: structured failure must own current visible state
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'Conversion failed',
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Output appears to be AsciiDoc instead of Markdown',
        },
      })
    )
    await convertText(
      '= Broken',
      'asciidoc',
      'markdown',
      setStatusState,
      setOutputState,
      setLoadingState,
      setNotificationState,
      {},
      null,
      setShowErrorModalState,
      setErrorMessageState,
      setBackendResultState,
      setUiState
    )

    expect(ui.conversionUiState).toBe('error')
    // stale success output must not be presented as current result
    expect(ui.output).toBe('')
    expect(ui.showErrorModal).toBe(true)
    expect(ui.notification?.type).toBe('error')
    expect(ui.notification?.message).toContain('CONVERSION_FAILED')
    expect(ui.backendResult).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED' }),
      })
    )
  })

  it('requires standardized conversionResult on markdown->asciidoc success path', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        asciidoc: '= Title\n\nBody',
      })
    )

    await convertText(
      '# Title\n\nBody',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    // Missing conversionResult must not be treated as successful migrated response.
    // Stale-output cleanup for migrated paths applies on the error branch.
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setBackendConversionResult).toHaveBeenCalledWith(null)
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      })
    )
  })

  it('clears stale output for structured markdown->asciidoc failure', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'Conversion failed',
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Pandoc conversion failed',
          details: { stage: 'pandoc-execution' },
        },
      })
    )

    await convertText(
      '# Broken input',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setOutput).toHaveBeenCalledWith('')
    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED' }),
      })
    )
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
  })

  it('does not accept migrated adoc->markdown success without markdown field', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        asciidoc: '= wrong field',
        conversionResult: { success: true, conversionId: 'bad-success-1', error: null },
      })
    )

    await convertText(
      '= Source',
      'asciidoc',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('does not accept migrated markdown->asciidoc success without asciidoc field', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# wrong field',
        conversionResult: { success: true, conversionId: 'bad-success-2', error: null },
      })
    )

    await convertText(
      '# Source',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('consumes standardized markdown->asciidoc success result and preserves semantics', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        asciidoc: '= Converted\n\nBody',
        conversionResult: {
          success: true,
          conversionId: 'm2a-success-1',
          converter: 'pandoc',
          error: null,
        },
      })
    )

    await convertText(
      '# Source',
      'markdown',
      'asciidoc',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        conversionId: 'm2a-success-1',
        converter: 'pandoc',
        error: null,
      })
    )
    expect(setOutput).toHaveBeenCalledWith('= Converted\n\nBody')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('success')
  })

  it('keeps state coherent across markdown->asciidoc error then success attempts', async () => {
    const ui = {
      output: 'STALE_OLD_SUCCESS',
      notification: { message: 'old', type: 'success', visible: true } as any,
      showErrorModal: true,
      errorMessage: 'old error',
      conversionUiState: 'idle' as 'idle' | 'loading' | 'success' | 'error',
      backendResult: null as any,
    }

    const setStatusState = (_: string) => {}
    const setOutputState = (s: string) => { ui.output = s }
    const setLoadingState = (_: boolean) => {}
    const setNotificationState = (n: any) => { ui.notification = n }
    const setShowErrorModalState = (v: boolean) => { ui.showErrorModal = v }
    const setErrorMessageState = (m: string) => { ui.errorMessage = m }
    const setBackendResultState = (r: any | null) => { ui.backendResult = r }
    const setUiState = (s: 'idle' | 'loading' | 'success' | 'error') => { ui.conversionUiState = s }

    // Attempt 1: structured failure owns current state/output.
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'Conversion failed',
        error: { code: 'CONVERSION_FAILED', message: 'Pandoc conversion failed' },
      })
    )
    await convertText(
      '# bad',
      'markdown',
      'asciidoc',
      setStatusState,
      setOutputState,
      setLoadingState,
      setNotificationState,
      {},
      null,
      setShowErrorModalState,
      setErrorMessageState,
      setBackendResultState,
      setUiState
    )

    expect(ui.conversionUiState).toBe('error')
    expect(ui.output).toBe('')
    expect(ui.notification?.type).toBe('error')
    expect(ui.backendResult).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'CONVERSION_FAILED' }),
      })
    )

    // Attempt 2: new request clears stale error indicators, then lands in success.
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        asciidoc: '= Clean result',
        conversionResult: { success: true, conversionId: 'm2a-success-2', error: null },
      })
    )
    await convertText(
      '# good',
      'markdown',
      'asciidoc',
      setStatusState,
      setOutputState,
      setLoadingState,
      setNotificationState,
      {},
      null,
      setShowErrorModalState,
      setErrorMessageState,
      setBackendResultState,
      setUiState
    )

    expect(ui.showErrorModal).toBe(false)
    expect(ui.errorMessage).toBe('')
    expect(ui.conversionUiState).toBe('success')
    expect(ui.output).toBe('= Clean result')
    expect(ui.notification?.type).toBe('success')
    expect(ui.backendResult).toEqual(expect.objectContaining({ success: true, conversionId: 'm2a-success-2' }))
  })

  it('consumes standardized txt->markdown success result and preserves semantics', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# Converted from text',
        conversionResult: {
          success: true,
          conversionId: 't2m-success-1',
          converter: 'text2markdown',
          error: null,
        },
      })
    )

    await convertText(
      'plain text',
      'txt',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        conversionId: 't2m-success-1',
        converter: 'text2markdown',
        error: null,
      })
    )
    expect(setOutput).toHaveBeenCalledWith('# Converted from text')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('success')
  })

  it('requires standardized conversionResult on txt->markdown success path', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeOkResponse({
        markdown: '# Converted but missing conversionResult',
      })
    )

    await convertText(
      'plain text',
      'txt',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('preserves structured failure semantics for txt->markdown and clears stale output', async () => {
    ;(globalThis as any).fetch = vi.fn().mockResolvedValue(
      makeErrorResponse(500, {
        success: false,
        detail: 'The text to convert is empty',
        error: { code: 'EMPTY_INPUT', message: 'The text to convert is empty' },
      })
    )

    await convertText(
      'text',
      'txt',
      'markdown',
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      {},
      null,
      setShowErrorModal,
      setErrorMessage,
      setBackendConversionResult,
      setConversionUiState
    )

    expect(setBackendConversionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'EMPTY_INPUT' }),
      })
    )
    expect(setOutput).toHaveBeenCalledWith('')
    expect(setConversionUiState).toHaveBeenCalledWith('loading')
    expect(setConversionUiState).toHaveBeenCalledWith('error')
    expect(setNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: expect.stringContaining('EMPTY_INPUT'),
      })
    )
  })
})

