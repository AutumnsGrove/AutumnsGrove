import { theme, CARD_RADIUS, FONT_FAMILY } from '../theme.js';

const LANG_CARD_WIDTH = 350;
const LANG_CARD_HEIGHT = 195;

/**
 * Render the Top Languages SVG card.
 *
 * Shows a stacked horizontal bar with language breakdowns,
 * plus a color-coded legend underneath.
 */
export function renderLanguagesCard(languages) {
  if (!languages || languages.length === 0) {
    return renderEmptyCard();
  }

  // Bar dimensions
  const barX = 25;
  const barY = 52;
  const barWidth = LANG_CARD_WIDTH - 50;
  const barHeight = 10;
  const barRadius = 5;

  // Build the stacked bar segments
  let offsetX = 0;
  const barSegments = languages.map((lang, i) => {
    const width = (lang.percent / 100) * barWidth;
    const x = offsetX;
    offsetX += width;
    const color = lang.color || theme.green500;
    // First segment gets left radius, last gets right radius
    const isFirst = i === 0;
    const isLast = i === languages.length - 1;
    if (isFirst || isLast) {
      return `<rect x="${barX + x}" y="${barY}" width="${width}" height="${barHeight}" fill="${color}"
        rx="${(isFirst && isLast) ? barRadius : 0}"
        ${isFirst ? `style="border-radius: ${barRadius}px 0 0 ${barRadius}px"` : ''}
      />`;
    }
    return `<rect x="${barX + x}" y="${barY}" width="${width}" height="${barHeight}" fill="${color}"/>`;
  });

  // Use clipPath for rounded bar
  const barContent = `
    <defs>
      <clipPath id="bar-clip">
        <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${barRadius}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#bar-clip)">
      ${barSegments.join('\n      ')}
    </g>`;

  // Legend grid (2 columns)
  const legendStartY = barY + barHeight + 22;
  const colWidth = (LANG_CARD_WIDTH - 50) / 2;
  const legendItems = languages.slice(0, 8).map((lang, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = barX + (col * colWidth);
    const y = legendStartY + (row * 22);
    const color = lang.color || theme.green500;
    const percent = lang.percent.toFixed(1);
    return `
      <g transform="translate(${x}, ${y})">
        <circle cx="5" cy="-4" r="5" fill="${color}"/>
        <text x="14" y="0" fill="${theme.textPrimary}" font-size="11.5" font-family="${FONT_FAMILY}">${escapeXml(lang.name)}</text>
        <text x="${colWidth - 10}" y="0" fill="${theme.textSecondary}" font-size="11" font-family="${FONT_FAMILY}" text-anchor="end">${percent}%</text>
      </g>`;
  });

  return `<svg width="${LANG_CARD_WIDTH}" height="${LANG_CARD_HEIGHT}" viewBox="0 0 ${LANG_CARD_WIDTH} ${LANG_CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .bar-group { animation: barGrow 0.8s ease forwards; transform-origin: ${barX}px ${barY}px; }
    .legend-item { opacity: 0; animation: fadeIn 0.4s ease forwards; }
  </style>
  <rect width="${LANG_CARD_WIDTH}" height="${LANG_CARD_HEIGHT}" rx="${CARD_RADIUS}" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <text x="25" y="32" fill="${theme.textPrimary}" font-size="16" font-weight="600" font-family="${FONT_FAMILY}">Most Used Languages</text>
  <line x1="25" y1="40" x2="${LANG_CARD_WIDTH - 25}" y2="40" stroke="${theme.border}" stroke-width="0.5"/>
  <g class="bar-group">
    ${barContent}
  </g>
  ${languages.slice(0, 8).map((lang, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = barX + (col * colWidth);
    const y = legendStartY + (row * 22);
    const color = lang.color || theme.green500;
    const percent = lang.percent.toFixed(1);
    return `<g class="legend-item" style="animation-delay: ${0.8 + i * 0.05}s" transform="translate(${x}, ${y})">
    <circle cx="5" cy="-4" r="5" fill="${color}"/>
    <text x="14" y="0" fill="${theme.textPrimary}" font-size="11.5" font-family="${FONT_FAMILY}">${escapeXml(lang.name)}</text>
    <text x="${colWidth - 10}" y="0" fill="${theme.textSecondary}" font-size="11" font-family="${FONT_FAMILY}" text-anchor="end">${percent}%</text>
  </g>`;
  }).join('\n  ')}
</svg>`;
}

function renderEmptyCard() {
  return `<svg width="${LANG_CARD_WIDTH}" height="${LANG_CARD_HEIGHT}" viewBox="0 0 ${LANG_CARD_WIDTH} ${LANG_CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${LANG_CARD_WIDTH}" height="${LANG_CARD_HEIGHT}" rx="${CARD_RADIUS}" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <text x="${LANG_CARD_WIDTH / 2}" y="${LANG_CARD_HEIGHT / 2}" text-anchor="middle" fill="${theme.textMuted}" font-size="14" font-family="${FONT_FAMILY}">No language data available</text>
</svg>`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
