import { theme, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS, FONT_FAMILY } from '../theme.js';
import { calculateRank } from '../github.js';

/**
 * Render the GitHub Stats SVG card.
 *
 * Shows: total stars, commits, PRs, issues, contributed-to repos,
 * with a rank circle on the right.
 */
export function renderStatsCard(stats) {
  const rank = calculateRank(stats);

  const items = [
    { label: 'Total Stars Earned', value: formatNumber(stats.totalStars), icon: starIcon() },
    { label: 'Total Commits (2026)', value: formatNumber(stats.totalCommits), icon: commitIcon() },
    { label: 'Total PRs', value: formatNumber(stats.totalPRs), icon: prIcon() },
    { label: 'Total Issues', value: formatNumber(stats.totalIssues), icon: issueIcon() },
    { label: 'Contributed To', value: formatNumber(stats.contributedTo), icon: repoIcon() },
  ];

  const lineHeight = 28;
  const startY = 55;

  const statsLines = items.map((item, i) => {
    const y = startY + (i * lineHeight);
    return `
      <g transform="translate(25, ${y})">
        <g transform="translate(0, -12)">${item.icon}</g>
        <text x="22" y="0" fill="${theme.textPrimary}" font-size="13" font-family="${FONT_FAMILY}">${item.label}:</text>
        <text x="305" y="0" fill="${theme.green400}" font-size="13" font-weight="600" font-family="${FONT_FAMILY}" text-anchor="end">${item.value}</text>
      </g>`;
  }).join('');

  // Rank circle
  const cx = CARD_WIDTH - 70;
  const cy = CARD_HEIGHT / 2;
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const progress = circumference * (1 - rank.percentile / 100);

  const rankCircle = `
    <g transform="translate(${cx}, ${cy})">
      <circle r="${r}" fill="none" stroke="${theme.border}" stroke-width="5" opacity="0.4"/>
      <circle r="${r}" fill="none" stroke="${theme.green600}" stroke-width="5"
        stroke-dasharray="${circumference}" stroke-dashoffset="${progress}"
        transform="rotate(-90)" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" from="${circumference}" to="${progress}" dur="1.2s" ease="ease-out" fill="freeze"/>
      </circle>
      <text y="-6" text-anchor="middle" fill="${theme.green400}" font-size="28" font-weight="700" font-family="${FONT_FAMILY}">${rank.level}</text>
      <text y="14" text-anchor="middle" fill="${theme.textMuted}" font-size="10" font-family="${FONT_FAMILY}">Top ${rank.percentile}%</text>
    </g>`;

  return `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
    .stat-line { opacity: 0; animation: fadeIn 0.4s ease forwards; }
  </style>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="${CARD_RADIUS}" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <text x="25" y="32" fill="${theme.textPrimary}" font-size="16" font-weight="600" font-family="${FONT_FAMILY}">${escapeXml(stats.name)}'s GitHub Stats</text>
  <line x1="25" y1="40" x2="${CARD_WIDTH - 25}" y2="40" stroke="${theme.border}" stroke-width="0.5"/>
  ${items.map((item, i) => {
    const y = startY + (i * lineHeight);
    return `<g class="stat-line" style="animation-delay: ${i * 0.1}s" transform="translate(25, ${y})">
      <g transform="translate(0, -12)">${item.icon}</g>
      <text x="22" y="0" fill="${theme.textPrimary}" font-size="13" font-family="${FONT_FAMILY}">${item.label}:</text>
      <text x="305" y="0" fill="${theme.green400}" font-size="13" font-weight="600" font-family="${FONT_FAMILY}" text-anchor="end">${item.value}</text>
    </g>`;
  }).join('\n  ')}
  ${rankCircle}
</svg>`;
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Small SVG icons (16x16) in grove green
function starIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green500}">
    <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
  </svg>`;
}

function commitIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green500}">
    <path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z"/>
  </svg>`;
}

function prIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green500}">
    <path d="M5.45 5.154A4.25 4.25 0 004.75 4.5h-1a.75.75 0 010-1.5h1a5.75 5.75 0 015.33 3.57.75.75 0 11-1.39.568A4.25 4.25 0 005.45 5.154zM5 9.5a.75.75 0 010 1.5H4.25a5.75 5.75 0 01-2.78-.718.75.75 0 11.727-1.312A4.25 4.25 0 004.25 9.5H5zm7.25-5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5a.75.75 0 01.75-.75zm-8.5 0A2.25 2.25 0 101.5 6.75 2.25 2.25 0 003.75 4.5zm0 5.5A2.25 2.25 0 101.5 12.25 2.25 2.25 0 003.75 10zm8.5 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"/>
  </svg>`;
}

function issueIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green500}">
    <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
  </svg>`;
}

function repoIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="${theme.green500}">
    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5zm-8 11h8v-1.5h-8a1 1 0 000 1.5z"/>
  </svg>`;
}
