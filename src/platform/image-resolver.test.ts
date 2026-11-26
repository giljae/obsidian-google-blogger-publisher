import { describe, it, expect } from 'vitest';
import { App } from 'obsidian';
import { createObsidianImageResolver } from './image-resolver';

describe('createObsidianImageResolver', () => {
  it('returns null for a missing file without throwing', async () => {
    const app = {
      metadataCache: { getFirstLinkpathDest: () => null },
      vault: { getAbstractFileByPath: () => null },
    } as unknown as App;
    const resolve = createObsidianImageResolver({
      app,
      sourcePath: '',
      maxWidth: 1600,
      quality: 0.8,
      format: 'auto',
    });
    await expect(resolve('missing.png')).resolves.toBeNull();
  });
});
