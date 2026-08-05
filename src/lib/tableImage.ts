import type { ExpenseMatrix } from './expenseMatrix';

/**
 * The expense matrix as a PNG, for pasting into a chat that will not take a
 * wide table as text.
 *
 * Always the light palette, whatever theme the sender is using: the image goes
 * to other people, and it should not arrive dark because of a setting on the
 * sender's phone. Drawn by hand on a canvas rather than screenshotting the DOM,
 * which would mean shipping a rasteriser to every visitor for a button most
 * will never press.
 */
const COLORS = {
  paper: '#ffffff',
  border: '#e4e7f1',
  borderStrong: '#cdd3e3',
  ink: '#14172b',
  inkMuted: '#626b85',
};

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
const font = (size: number, weight = 400) => `${weight} ${size}px ${FONT}`;

const PAD = 28;
const CELL_PAD = 16;
const HEADER_H = 34;
const ROW_H = 52;
const TOTALS_H = 48;
/** Drawn at 2× so the image stays sharp when a chat app scales it up. */
const SCALE = 2;

const DASH = '—';

function widthOf(measure: CanvasRenderingContext2D, text: string, spec: string): number {
  measure.font = spec;
  return measure.measureText(text).width;
}

/** Every column as wide as its widest line, header and totals included. */
function columnWidths(measure: CanvasRenderingContext2D, matrix: ExpenseMatrix): number[] {
  const first = Math.max(
    widthOf(measure, matrix.firstHeader, font(13, 500)),
    widthOf(measure, matrix.totalsLabel, font(15, 600)),
    ...matrix.rows.map((row) =>
      Math.max(widthOf(measure, row.label, font(15, 500)), widthOf(measure, row.meta, font(12))),
    ),
  );

  const money = matrix.columns.map((name, index) =>
    Math.max(
      widthOf(measure, name, font(13, 500)),
      widthOf(measure, matrix.totalsCells[index] ?? '', font(15, 600)),
      ...matrix.rows.map((row) => {
        const cell = row.cells[index];
        return widthOf(measure, cell?.missing ? DASH : (cell?.text ?? ''), font(15));
      }),
    ),
  );

  const total = Math.max(
    widthOf(measure, matrix.totalHeader, font(13, 500)),
    widthOf(measure, matrix.grandTotal, font(15, 600)),
    ...matrix.rows.map((row) => widthOf(measure, row.total, font(15, 600))),
  );

  return [first, ...money, total].map((value) => Math.ceil(value) + CELL_PAD * 2);
}

export function drawExpenseMatrix(canvas: HTMLCanvasElement, matrix: ExpenseMatrix): void {
  const measure = canvas.getContext('2d');
  if (!measure) return;

  const widths = columnWidths(measure, matrix);
  const tableWidth = widths.reduce((sum, value) => sum + value, 0);
  const width = tableWidth + PAD * 2;
  const titleTop = PAD + 22;
  const tableTop = titleTop + (matrix.subtitle ? 24 : 4) + 20;
  const tableHeight = HEADER_H + matrix.rows.length * ROW_H + TOTALS_H;
  const height = tableTop + tableHeight + 26 + PAD;

  canvas.width = Math.ceil(width * SCALE);
  canvas.height = Math.ceil(height * SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = COLORS.ink;
  ctx.font = font(19, 600);
  ctx.textAlign = 'left';
  ctx.fillText(matrix.title, PAD, titleTop);
  if (matrix.subtitle) {
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = font(13);
    ctx.fillText(matrix.subtitle, PAD, titleTop + 21);
  }

  // Column x positions: the description column is left-aligned, money right-aligned.
  const edges: number[] = [];
  let x = PAD;
  for (const w of widths) {
    edges.push(x);
    x += w;
  }
  const right = (index: number) => edges[index] + widths[index] - CELL_PAD;

  const line = (y: number, color: string, thickness = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(PAD, y, tableWidth, thickness);
  };

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = font(13, 500);
  ctx.textAlign = 'left';
  ctx.fillText(matrix.firstHeader, edges[0] + CELL_PAD, tableTop + 22);
  ctx.textAlign = 'right';
  [...matrix.columns, matrix.totalHeader].forEach((name, index) => {
    ctx.fillText(name, right(index + 1), tableTop + 22);
  });
  line(tableTop + HEADER_H - 1, COLORS.border);

  matrix.rows.forEach((row, rowIndex) => {
    const top = tableTop + HEADER_H + rowIndex * ROW_H;
    if (rowIndex > 0) line(top, COLORS.border);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(15, 500);
    ctx.fillText(row.label, edges[0] + CELL_PAD, top + 22);
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = font(12);
    ctx.fillText(row.meta, edges[0] + CELL_PAD, top + 39);

    ctx.textAlign = 'right';
    row.cells.forEach((cell, index) => {
      ctx.fillStyle = cell.missing ? COLORS.borderStrong : COLORS.ink;
      ctx.font = font(15);
      ctx.fillText(cell.missing ? DASH : cell.text, right(index + 1), top + 30);
    });
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(15, 600);
    ctx.fillText(row.total, right(matrix.columns.length + 1), top + 30);
  });

  const totalsTop = tableTop + HEADER_H + matrix.rows.length * ROW_H;
  line(totalsTop, COLORS.borderStrong, 2);
  ctx.fillStyle = COLORS.ink;
  ctx.font = font(15, 600);
  ctx.textAlign = 'left';
  ctx.fillText(matrix.totalsLabel, edges[0] + CELL_PAD, totalsTop + 30);
  ctx.textAlign = 'right';
  [...matrix.totalsCells, matrix.grandTotal].forEach((value, index) => {
    ctx.fillText(value, right(index + 1), totalsTop + 30);
  });

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = font(12);
  ctx.textAlign = 'left';
  ctx.fillText(matrix.note, PAD, totalsTop + TOTALS_H + 20);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

/** The matrix as a PNG blob, or null if this browser cannot produce one. */
export async function renderExpenseMatrixImage(matrix: ExpenseMatrix): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  drawExpenseMatrix(canvas, matrix);
  if (canvas.width === 0) return null;
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/** A filename a phone will accept: no separators, no surprises. */
export function imageFilename(tripName: string): string {
  const stem = tripName
    // Đ/đ is its own letter, not a marked D, so NFD leaves it for the strip below.
    .replace(/[Đđ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${stem || 'expenses'}.png`;
}
