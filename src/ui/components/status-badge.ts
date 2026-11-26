/** Render a small connection-status badge. */
export function renderStatusBadge(
  container: HTMLElement,
  connected: boolean,
  connectedText: string,
  warningText: string,
): void {
  container.createSpan({
    cls: `gbp-badge ${connected ? 'is-connected' : 'is-warning'}`,
    text: connected ? connectedText : warningText,
  });
}
