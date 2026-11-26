import { addIcon } from 'obsidian';

/** Register the plugin's ribbon icon. */
export function addIcons(): void {
  addIcon(
    'blogger-logo',
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3h9.2L20 8.3v11.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z"/>
      <path d="M14 3v6h6"/>
      <path d="M8 13h8M8 17h5"/>
    </svg>`,
  );
}
