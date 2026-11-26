import { describe, it, expect } from 'vitest';
import { I18n } from './index';

describe('i18n', () => {
  it('interpolates variables', () => {
    expect(new I18n('en').t('message_imagesEmbedFailed', { count: '2' })).toContain('2');
  });

  it('returns a non-empty string for a known key', () => {
    expect(new I18n('en').t('confirmModal_confirm')).not.toBe('');
  });

  it('falls back to en for an unknown/unsupported language', () => {
    expect(new I18n('ko').t('confirmModal_confirm')).not.toBe('');
  });
});
