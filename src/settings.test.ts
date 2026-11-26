import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, upgradeSettings } from './settings';

describe('settings', () => {
  it('has image defaults', () => {
    expect(DEFAULT_SETTINGS.embedLocalImages).toBe(true);
    expect(DEFAULT_SETTINGS.imageMaxWidth).toBe(1600);
    expect(DEFAULT_SETTINGS.imageQuality).toBe(0.8);
    expect(DEFAULT_SETTINGS.imageFormat).toBe('auto');
  });

  it('fills missing fields for legacy data while keeping existing values', () => {
    const settings = upgradeSettings({ lang: 'ko' });
    expect(settings.lang).toBe('ko');
    expect(settings.imageMaxWidth).toBe(1600);
    expect(settings.autoFitPostSize).toBe(true);
  });
});
