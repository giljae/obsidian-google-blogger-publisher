import { Setting } from 'obsidian';

/** Render a section heading inside a settings tab. */
export function renderSection(container: HTMLElement, title: string): void {
  new Setting(container).setName(title).setHeading();
}
