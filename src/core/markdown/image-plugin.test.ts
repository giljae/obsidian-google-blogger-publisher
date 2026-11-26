import { describe, it, expect } from 'vitest';
import MarkdownIt from 'markdown-it';
import { imagePlugin } from './image-plugin';

const md = (): MarkdownIt => {
  const m = new MarkdownIt();
  imagePlugin(m);
  return m;
};

describe('image plugin', () => {
  it('renders width from ![alt|300](src)', () => {
    expect(md().render('![x|300](a.png)')).toContain('<img src="a.png" width="300"');
  });

  it('renders width and height from ![alt|300x200](src)', () => {
    const out = md().render('![x|300x200](a.png)');
    expect(out).toContain('width="300"');
    expect(out).toContain('height="200"');
  });

  it('renders an Obsidian wikilink image ![[a.png|200]]', () => {
    expect(md().render('![[a.png|200]]')).toContain('<img src="a.png" width="200"');
  });

  it('renders a wikilink image without size', () => {
    expect(md().render('![[a.png]]')).toContain('<img src="a.png"');
  });
});
