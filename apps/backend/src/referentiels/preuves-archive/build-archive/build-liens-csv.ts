export interface LienPreuve {
  titre: string;
  url: string;
  commentaire: string;
}

const CSV_HEADER = ['Titre', 'URL', 'Commentaire'] as const;

const FORMULA_TRIGGERS = new Set<string>(['=', '+', '-', '@', '\t', '\r']);

const ALLOWED_URL_SCHEMES = ['http://', 'https://'];

const UNSAFE_URL_PLACEHOLDER = '[URL non sûre]';

function neutralizeFormula(value: string): string {
  const firstChar = value[0];
  return firstChar !== undefined && FORMULA_TRIGGERS.has(firstChar)
    ? `'${value}`
    : value;
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === '') {
    return '';
  }
  const lower = trimmed.toLowerCase();
  return ALLOWED_URL_SCHEMES.some((scheme) => lower.startsWith(scheme))
    ? trimmed
    : UNSAFE_URL_PLACEHOLDER;
}

function escapeCsvField(value: string): string {
  const neutralized = neutralizeFormula(value);
  if (/["\r\n,]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function buildLiensCsv(liens: LienPreuve[]): string {
  const lines = [
    CSV_HEADER.join(','),
    ...liens.map((lien) =>
      [lien.titre, sanitizeUrl(lien.url), lien.commentaire]
        .map(escapeCsvField)
        .join(',')
    ),
  ];
  return `${lines.join('\n')}\n`;
}
