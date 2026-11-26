import { describe, it, expect } from 'vitest';
import { stripFrontMatter } from './vault';

describe('stripFrontMatter', () => {
  it('removes a leading --- block and trims', () => {
    expect(stripFrontMatter('---\ntitle: x\n---\nbody')).toBe('body');
  });

  it('keeps a note with no front matter intact', () => {
    expect(stripFrontMatter('just body')).toBe('just body');
  });

  it('does not strip a --- that appears inside the body', () => {
    expect(stripFrontMatter('intro\n\n---\n\nmore')).toBe('intro\n\n---\n\nmore');
  });
});
