import { App, TFile } from 'obsidian';
import { MatterData } from '../core/types';

/** Remove a leading YAML front-matter block and trim the rest. */
export function stripFrontMatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/);
  return (match ? raw.slice(match[0].length) : raw).trim();
}

/** Read the active note's body (front matter stripped) and its front matter. */
export async function readNote(
  app: App,
  file: TFile,
): Promise<{ content: string; matter: MatterData }> {
  let matter: MatterData | undefined = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!matter) {
    await app.fileManager.processFrontMatter(file, (fm) => {
      matter = fm;
    });
  }
  const raw = await app.vault.read(file);
  return { content: stripFrontMatter(raw), matter: matter ?? {} };
}

/** Write the Blogger post id and profile name back into the note's front matter. */
export async function writePostMeta(
  app: App,
  file: TFile,
  meta: { postId: string; profileName: string },
): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.postId = meta.postId;
    fm.profileName = meta.profileName;
  });
}
