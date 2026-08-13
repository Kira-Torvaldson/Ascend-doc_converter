import { describe, expect, it } from 'vitest';
import {
  isDangerousPreviewUrl,
  sanitizeHtmlForPreview,
} from './sanitizeHtmlPreview';

describe('sanitizeHtmlForPreview', () => {
  it('keeps ordinary markup', () => {
    expect(sanitizeHtmlForPreview('<p>Hello <strong>world</strong></p>')).toBe(
      '<p>Hello <strong>world</strong></p>'
    );
  });

  it('strips script, style and svg including slash-onload', () => {
    const dirty =
      '<p>ok</p><script>alert(1)</script><style>body{}</style><svg/onload=alert(1)><p>end</p>';
    const clean = sanitizeHtmlForPreview(dirty);
    expect(clean).toContain('<p>ok</p>');
    expect(clean).toContain('<p>end</p>');
    expect(clean.toLowerCase()).not.toContain('script');
    expect(clean.toLowerCase()).not.toContain('style');
    expect(clean.toLowerCase()).not.toContain('svg');
    expect(clean.toLowerCase()).not.toContain('onload');
  });

  it('neutralizes javascript: hidden with entities', () => {
    const clean = sanitizeHtmlForPreview(
      '<a href="&#106;avascript:alert(1)">x</a>'
    );
    expect(clean.toLowerCase()).not.toContain('javascript');
    expect(clean).toContain('href="#"');
  });

  it('strips spaced event handlers', () => {
    const clean = sanitizeHtmlForPreview('<img src="x.png" onerror="alert(1)">');
    expect(clean.toLowerCase()).not.toContain('onerror');
    expect(clean).toContain('src="x.png"');
  });

  it('flags dangerous URLs after entity decode', () => {
    expect(isDangerousPreviewUrl('https://example.com')).toBe(false);
    expect(isDangerousPreviewUrl('javascript:alert(1)')).toBe(true);
    expect(isDangerousPreviewUrl('&#106;avascript:alert(1)')).toBe(true);
  });
});
