import { Notice } from 'obsidian';
import { ERROR_NOTICE_TIMEOUT } from '../consts';

const messageOf = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export function showError(error: unknown): void {
  new Notice(messageOf(error), ERROR_NOTICE_TIMEOUT);
  console.error('[Google Blogger Publisher]', messageOf(error));
}

export function showSuccess(message: string): void {
  new Notice(message);
}

/** A notice that stays until `hide()` is called. */
export function showProgress(message: string): Notice {
  const notice = new Notice(message, 0);
  return notice;
}
