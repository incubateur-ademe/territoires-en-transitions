const BULLET_LINE = /^\s*[-•*–]\s+(.+)$/;

/**
 * Le modèle rend les listes en lignes « - … », que l'éditeur des fiches lirait
 * comme des paragraphes : on les lui donne en HTML, qu'il sait lire. Un texte
 * sans puce reste tel quel.
 */
export const textToRichText = (text: string): string => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.some((line) => BULLET_LINE.test(line))) {
    return text;
  }
  const html: string[] = [];
  let items: string[] = [];
  const flushItems = () => {
    if (items.length > 0) {
      html.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      items = [];
    }
  };
  for (const line of lines) {
    const bullet = line.match(BULLET_LINE);
    if (bullet) {
      items.push(escapeHtml(bullet[1].trim()));
    } else {
      flushItems();
      html.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  flushItems();
  return html.join('');
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
