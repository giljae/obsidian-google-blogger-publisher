import { moment } from 'obsidian';
import { LANGUAGES } from './langs';

export type Language = keyof typeof LANGUAGES;
export type LanguageWithAuto = Language | 'auto';
export type TranslateKey = keyof (typeof LANGUAGES)['en'];

const isLanguage = (value: string): value is Language => value === 'en' || value === 'ko';

export class I18n {
  constructor(private readonly lang: LanguageWithAuto = 'auto') {}

  t(key: TranslateKey, vars?: Record<string, string>): string {
    const text = this.get(key);
    if (!vars) {
      return text;
    }
    return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => vars[name] ?? `{{${name}}}`);
  }

  private get(key: TranslateKey): string {
    return this.dict(this.resolveLang())[key] ?? this.dict('en')[key] ?? String(key);
  }

  private resolveLang(): Language {
    if (this.lang !== 'auto') {
      return this.lang;
    }
    const locale = moment.locale().replace('-', '_').split('_')[0];
    return isLanguage(locale) ? locale : 'en';
  }

  private dict(lang: Language): Record<string, string> {
    return LANGUAGES[lang];
  }
}

let i18n = new I18n();

export const setGlobalLang = (lang?: LanguageWithAuto): void => {
  i18n = new I18n(lang);
};

export const getGlobalI18n = (): I18n => i18n;
