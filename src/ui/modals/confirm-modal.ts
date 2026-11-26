import { App, Modal, Setting } from 'obsidian';
import { getGlobalI18n } from '../../i18n';

export const ConfirmCode = {
  Confirm: 'confirm',
  Cancel: 'cancel',
} as const;
export type ConfirmCode = (typeof ConfirmCode)[keyof typeof ConfirmCode];

export interface ConfirmModalMessages {
  message: string;
  cancelText?: string;
  confirmText?: string;
}

export function openConfirmModal(
  messages: ConfirmModalMessages,
  app: App,
): Promise<{ code: ConfirmCode }> {
  return new Promise((resolve) => {
    const modal = new ConfirmModal(messages, app, (code) => {
      resolve({ code });
      modal.close();
    });
    modal.open();
  });
}

class ConfirmModal extends Modal {
  constructor(
    private readonly messages: ConfirmModalMessages,
    app: App,
    private readonly onAction: (code: ConfirmCode) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const t = getGlobalI18n();
    const { contentEl } = this;
    contentEl.createEl('h1', { text: t.t('confirmModal_title') });
    new Setting(contentEl).setName(this.messages.message);
    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.messages.cancelText ?? t.t('confirmModal_cancel'))
          .onClick(() => this.onAction(ConfirmCode.Cancel)),
      )
      .addButton((button) =>
        button
          .setButtonText(this.messages.confirmText ?? t.t('confirmModal_confirm'))
          .setCta()
          .onClick(() => this.onAction(ConfirmCode.Confirm)),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
