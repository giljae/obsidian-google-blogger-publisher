import { describe, it, expect } from 'vitest';
import {
  measureUtf8Bytes,
  estimatePostRequestBytes,
  checkPostSize,
  BLOGGER_REQUEST_LIMIT,
} from './blogger-size';

describe('blogger-size', () => {
  it('counts utf-8 bytes for multibyte text', () => {
    expect(measureUtf8Bytes('a')).toBe(1);
    expect(measureUtf8Bytes('한')).toBe(3);
  });
  it('estimates json request bytes close to actual', () => {
    const n = estimatePostRequestBytes({ title: 't', content: '한'.repeat(100), labels: ['x'] });
    expect(n).toBeGreaterThan(300);
  });
  it('classifies ok / warn / over', () => {
    expect(checkPostSize(1000)).toBe('ok');
    expect(checkPostSize(1_900_000)).toBe('warn');
    expect(checkPostSize(BLOGGER_REQUEST_LIMIT + 1)).toBe('over');
  });
});
