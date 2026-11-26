import { describe, it, expect } from 'vitest';
import { buildContent } from './publish';
import { DEFAULT_SETTINGS } from './settings';

describe('buildContent', () => {
  it('reports a size status and wraps the content', async () => {
    const result = await buildContent({
      rendered: '<p>x</p>',
      settings: { ...DEFAULT_SETTINGS, embedLocalImages: false },
      title: 't',
      labels: [],
      sourcePath: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      app: null as any,
    });
    expect(['ok', 'warn', 'over']).toContain(result.status);
    expect(result.html).toContain('obsidian-blogger-post');
  });
});
