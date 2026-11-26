import { describe, it, expect, vi } from 'vitest';
import { autoFitPostSize } from './auto-fit';

const base = {
  limit: 2_097_152,
  targetBytes: 1_887_437,
  initialQuality: 0.8,
  initialMaxWidth: 1600,
};

describe('autoFitPostSize', () => {
  it('does one attempt and reports no compression when already under target', async () => {
    const build = vi.fn(async () => ({ html: '<div>ok</div>', bytes: 1_000_000 }));
    const r = await autoFitPostSize({ ...base, build });
    expect(build).toHaveBeenCalledTimes(1);
    expect(r.fits).toBe(true);
    expect(r.compressed).toBe(false);
    expect(r.attempts).toBe(1);
    expect(r.quality).toBe(0.8);
  });

  it('lowers quality and maxWidth until it fits, then stops', async () => {
    const calls: Array<{ quality: number; maxWidth: number }> = [];
    const build = vi.fn(async (p: { quality: number; maxWidth: number }) => {
      calls.push(p);
      return { html: `<div>${p.quality}</div>`, bytes: p.quality <= 0.6 ? 1_000_000 : 8_000_000 };
    });
    const r = await autoFitPostSize({ ...base, build });
    expect(calls[0]).toEqual({ quality: 0.8, maxWidth: 1600 });
    expect(calls.length).toBe(2);
    expect(calls[1].quality).toBeLessThan(0.8);
    expect(calls[1].maxWidth).toBeLessThan(1600);
    expect(r.fits).toBe(true);
    expect(r.compressed).toBe(true);
    expect(r.attempts).toBe(2);
  });

  it('gives up after maxAttempts and reports fits=false when still over the limit', async () => {
    const build = vi.fn(async () => ({ html: '<div>big</div>', bytes: 9_000_000 }));
    const r = await autoFitPostSize({ ...base, maxAttempts: 3, build });
    expect(build).toHaveBeenCalledTimes(3);
    expect(r.fits).toBe(false);
  });

  it('never goes below the quality/width floors', async () => {
    const calls: Array<{ quality: number; maxWidth: number }> = [];
    const build = vi.fn(async (p: { quality: number; maxWidth: number }) => {
      calls.push(p);
      return { html: 'x', bytes: 9_000_000 };
    });
    await autoFitPostSize({ ...base, minQuality: 0.5, minWidth: 1000, maxAttempts: 10, build });
    for (const c of calls) {
      expect(c.quality).toBeGreaterThanOrEqual(0.5);
      expect(c.maxWidth).toBeGreaterThanOrEqual(1000);
    }
  });
});
