import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('runs with jsdom DOMParser available', () => {
    expect(typeof DOMParser).toBe('function');
  });
});
