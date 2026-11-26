import { addIcon } from 'obsidian';

/** The Blogger "B" mark: an orange rounded square with a white B. */
export function addIcons(): void {
  addIcon(
    'blogger-logo',
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1.25" y="1.25" width="21.5" height="21.5" rx="5.25" fill="#ff5722"/>
      <text x="12" y="17.4" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#ffffff">B</text>
    </svg>`,
  );
}
