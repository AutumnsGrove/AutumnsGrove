import { theme, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS, FONT_FAMILY } from '../theme.js';

/**
 * Render the Contribution Streak SVG card.
 *
 * Three columns: Total Contributions | Current Streak | Longest Streak
 */
export function renderStreakCard(streak, stats) {
  const colWidth = CARD_WIDTH / 3;
  const centerY = CARD_HEIGHT / 2 + 8;

  const columns = [
    {
      label: 'Total Contributions',
      value: formatNumber(streak.total),
      sublabel: `${new Date().getFullYear()} so far`,
    },
    {
      label: 'Current Streak',
      value: String(streak.current),
      sublabel: streak.current === 1 ? 'day' : 'days',
      highlight: true,
    },
    {
      label: 'Longest Streak',
      value: String(streak.longest),
      sublabel: streak.longest === 1 ? 'day' : 'days',
    },
  ];

  const columnSvg = columns.map((col, i) => {
    const cx = colWidth * i + colWidth / 2;
    const valueColor = col.highlight ? theme.green400 : theme.green300;
    const valueSize = col.highlight ? 32 : 26;

    return `
      <g transform="translate(${cx}, 0)">
        <text y="${centerY - 18}" text-anchor="middle" fill="${valueColor}" font-size="${valueSize}" font-weight="700" font-family="${FONT_FAMILY}">${col.value}</text>
        <text y="${centerY + 6}" text-anchor="middle" fill="${theme.textPrimary}" font-size="12" font-weight="500" font-family="${FONT_FAMILY}">${col.label}</text>
        <text y="${centerY + 22}" text-anchor="middle" fill="${theme.textMuted}" font-size="10" font-family="${FONT_FAMILY}">${col.sublabel}</text>
      </g>`;
  }).join('');

  // Vertical dividers between columns
  const dividers = [1, 2].map(i => {
    const x = colWidth * i;
    return `<line x1="${x}" y1="45" x2="${x}" y2="${CARD_HEIGHT - 20}" stroke="${theme.border}" stroke-width="0.5"/>`;
  }).join('\n  ');

  // Small fire icon for current streak
  const fireX = CARD_WIDTH / 2;
  const fireY = 48;
  const fireIcon = streak.current > 0 ? `
    <g transform="translate(${fireX - 8}, ${fireY})">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green400}">
        <path d="M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037C9.865 5.343 8.66 4.088 8.198 1.5 6.938 3.34 6.5 4.36 6.5 5.5c0 .56-.112.866-.278 1.09-.187.251-.42.398-.842.398-.576 0-1.38-.643-1.38-2.488 0-.143.007-.285.02-.425C3.036 5.558 2.998 7.07 2.998 8c0 3.59 2.247 6.5 5 6.5z"/>
      </svg>
    </g>` : '';

  return `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .streak-col { opacity: 0; animation: fadeIn 0.5s ease forwards; }
  </style>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="${CARD_RADIUS}" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <text x="${CARD_WIDTH / 2}" y="30" text-anchor="middle" fill="${theme.textPrimary}" font-size="16" font-weight="600" font-family="${FONT_FAMILY}">Contribution Streak</text>
  <line x1="25" y1="38" x2="${CARD_WIDTH - 25}" y2="38" stroke="${theme.border}" stroke-width="0.5"/>
  ${fireIcon}
  ${dividers}
  ${columns.map((col, i) => {
    const cx = colWidth * i + colWidth / 2;
    const valueColor = col.highlight ? theme.green400 : theme.green300;
    const valueSize = col.highlight ? 32 : 26;
    return `<g class="streak-col" style="animation-delay: ${i * 0.15}s" transform="translate(${cx}, 0)">
    <text y="${centerY - 18}" text-anchor="middle" fill="${valueColor}" font-size="${valueSize}" font-weight="700" font-family="${FONT_FAMILY}">${col.value}</text>
    <text y="${centerY + 6}" text-anchor="middle" fill="${theme.textPrimary}" font-size="12" font-weight="500" font-family="${FONT_FAMILY}">${col.label}</text>
    <text y="${centerY + 22}" text-anchor="middle" fill="${theme.textMuted}" font-size="10" font-family="${FONT_FAMILY}">${col.sublabel}</text>
  </g>`;
  }).join('\n  ')}
</svg>`;
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
