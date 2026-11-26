export interface TableStyleOptions {
  tableStyle?: string;
  cellStyle?: string;
  headerStyle?: string;
}

export const DEFAULT_TABLE_STYLE = 'border-collapse:collapse; width:100%; margin:1em 0;';
export const DEFAULT_CELL_STYLE =
  'border:1px solid #d0d7de; padding:6px 12px; vertical-align:top;';
export const DEFAULT_HEADER_STYLE = 'background:#f6f8fa; font-weight:600;';

/**
 * Append CSS declarations from `addition` to `existing`, skipping any
 * declaration whose property is already present in `existing` (so an
 * existing `text-align` from markdown-it is never overwritten).
 */
function mergeStyle(existing: string | null, addition: string): string {
  const parts = addition
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const have = new Set(
    (existing ?? '')
      .split(';')
      .map((s) => s.split(':')[0]?.trim().toLowerCase())
      .filter(Boolean),
  );
  const toAdd = parts.filter((p) => !have.has(p.split(':')[0]?.trim().toLowerCase()));
  const base = (existing ?? '').trim().replace(/;\s*$/, '');
  if (toAdd.length === 0) {
    return base;
  }
  const added = toAdd.join('; ');
  return base ? `${base}; ${added}` : added;
}

/**
 * Add inline styles to every table/th/td in the given HTML so the table
 * survives Blogger's theme (which has no table borders and `td,th{padding:0}`).
 * Handles both markdown-it tables and raw HTML tables.
 */
export function applyTableStyles(html: string, options: TableStyleOptions = {}): string {
  if (!/<table[\s>]/i.test(html)) {
    return html;
  }
  const tableStyle = options.tableStyle ?? DEFAULT_TABLE_STYLE;
  const cellStyle = options.cellStyle ?? DEFAULT_CELL_STYLE;
  const headerStyle = options.headerStyle ?? DEFAULT_HEADER_STYLE;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('table').forEach((table) => {
    table.setAttribute('style', mergeStyle(table.getAttribute('style'), tableStyle));
    table.querySelectorAll('th, td').forEach((cell) => {
      let style = mergeStyle(cell.getAttribute('style'), cellStyle);
      if (cell.tagName.toLowerCase() === 'th') {
        style = mergeStyle(style, headerStyle);
      }
      cell.setAttribute('style', style);
    });
  });
  return doc.body.innerHTML;
}
