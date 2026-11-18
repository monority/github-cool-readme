// Languages as a pinball-style display: one language at a time, one bar that grows and shrinks.

import type { LanguageItem } from './data.ts';
import { textCells, textWidth } from '../../display/font.ts';
import { COLS, H, PITCH, W, frame, keyframes, path, type Cell, type Style } from '../../display/dmd.ts';
import { ENTER, HOLD, slideshow, type Item } from '../../display/slides.ts';
import { fit, titleLine } from '../../display/text.ts';

const BAR = { col: 4, row: 54, cols: COLS - 8, rows: 6 };
const px = (cells: number) => cells * PITCH;

/**
 * The languages as a list: one line each, the name on the left, its share on the right, joined by a
 * dotted leader. The rows share the height, so fewer languages get more air. Still, not a slideshow:
 * the card is read, not watched.
 */
function renderList(items: LanguageItem[], title: string | null, style: Style, header: string): string {
  const { look } = style;
  const shown = items.slice(0, 7);
  const LINE = Math.min(10, Math.floor(58 / shown.length));
  const TOP = 11;
  const names: Cell[] = [];
  const values: Cell[] = [];
  const leaders: Cell[] = [];
  shown.forEach((language, i) => {
    const row = TOP + i * LINE;
    const percent = `${language.percent.toFixed(1)}%`;
    const percentCol = COLS - 4 - textWidth(percent);
    const name = fit(language.name.toUpperCase(), Math.max(1, percentCol - 14));
    names.push(...textCells(name, 4, row));
    values.push(...textCells(percent, percentCol, row));
    for (let c = 4 + textWidth(name) + 4; c < percentCol - 4; c += 3) leaders.push([c, row + 3]);
  });
  return frame({
    title: title ?? 'Most used languages',
    desc: items.map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join(', '),
    ...style, css: '',
    body:
      header +
      path(style, leaders, look.lit, `fill-opacity="${(look.dim * 0.35).toFixed(2)}"`) +
      path(style, names, look.lit, `fill-opacity="${look.dim}"`) +
      path(style, values, look.lit),
  });
}

export function renderDisplayLanguages(
  items: LanguageItem[],
  settings: { title: string | null; layout: 'slides' | 'list' },
  style: Style,
): string {
  const { look } = style;
  const { title, layout } = settings;
  const header = titleLine(title, style);
  if (!items.length) {
    return frame({
      title: title ?? 'Languages', desc: 'No language data.', ...style, css: '',
      body: header + path(style, textCells('NO DATA YET', 4, 24), look.lit),
    });
  }
  if (layout === 'list') return renderList(items, title, style, header);

  const slides: Item[][] = items.map((l, i) => {
    const counter = `${i + 1}/${items.length}`;
    const counterCol = COLS - 4 - textWidth(counter);
    return [
      { text: fit(l.name.toUpperCase(), counterCol - 8), col: 4, row: 21 },
      { text: counter, col: counterCol, row: 21, dim: true },
      { text: `${l.percent.toFixed(1)}%`, col: 4, row: 32, scale: 2, shine: true },
    ];
  });
  const show = slideshow('l', slides, { col: 0, row: 18, cols: COLS, rows: 31 }, style, ['push', 'wipe']);

  // One bar for all languages: it grows or shrinks to each language's share, a dot at a time.
  const bar: Cell[] = [];
  for (let r = BAR.row; r < BAR.row + BAR.rows; r++) for (let c = BAR.col; c < BAR.col + BAR.cols; c++) bar.push([c, r]);
  const widths = items.map((l) => Math.max(1, Math.round((l.percent / 100) * BAR.cols)));
  const frames: { t: number; css: string; ease?: string }[] = [];
  widths.forEach((w, i) => {
    const prev = i === 0 ? 0 : widths[i - 1];
    frames.push({ t: i * HOLD, css: `transform: scaleX(${prev / BAR.cols});`, ease: `steps(${Math.max(1, Math.abs(w - prev))})` });
    frames.push({ t: i * HOLD + ENTER, css: `transform: scaleX(${w / BAR.cols});` });
  });
  frames.push({ t: show.total, css: `transform: scaleX(${widths.at(-1)! / BAR.cols});` });
  // At rest (no animation) the bar shows the first language's share.
  const rest = `translate(${px(BAR.col)} 0) scale(${widths[0] / BAR.cols} 1) translate(-${px(BAR.col)} 0)`;
  const barDefs = `<mask id="lbar" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect class="lbar" x="${px(BAR.col)}" y="0" width="${px(BAR.cols)}" height="${H}" fill="#fff" transform="${rest}"/></mask>`;
  const barCss = `\n  .lbar { transform-box: fill-box; transform-origin: left; animation: lbar ${show.total}s infinite; }` + keyframes('lbar', show.total, frames);
  const barPart = path(style, bar, look.accent, 'fill-opacity="0.22"') + `<g mask="url(#lbar)">${path(style, bar, look.accent)}</g>`;

  return frame({
    title: title ?? 'Most used languages',
    desc: items.map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join(', '),
    ...style,
    css: show.css + barCss,
    body: `<defs>${show.defs}${barDefs}</defs>\n${header}\n${show.markup}\n${barPart}`,
  });
}
