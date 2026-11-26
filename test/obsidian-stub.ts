import { vi } from 'vitest';

export const moment = { locale: () => 'en' };

export const requestUrl = vi.fn(async () => ({
  status: 200,
  json: {},
  text: '',
  arrayBuffer: new ArrayBuffer(0),
}));

export class Setting {
  constructor(public containerEl?: unknown) {}
  setName() {
    return this;
  }
  setDesc() {
    return this;
  }
  setHeading() {
    return this;
  }
  addToggle() {
    return this;
  }
  addText() {
    return this;
  }
  addDropdown() {
    return this;
  }
  addButton() {
    return this;
  }
  addExtraButton() {
    return this;
  }
}

export class App {}
export class TFile {}
export class Plugin {}
export class PluginSettingTab {}
export class Modal {}
export class Notice {}
export class ButtonComponent {}

export const Platform = { isMobile: false, isDesktop: true };

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function addIcon(): void {}
