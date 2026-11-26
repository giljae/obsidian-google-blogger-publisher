import { describe, it, expect } from 'vitest';
import { App } from 'obsidian';
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
      app: null as unknown as App,
    });
    expect(['ok', 'warn', 'over']).toContain(result.status);
    expect(result.html).toContain('obsidian-blogger-post');
  });
});
