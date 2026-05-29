import type { PartialBlock } from '@blocknote/core';

const MARKDOWN_SYNTAX_PATTERN =
  /(\*\*|__|\[[^\]]+\]\(|<\/?[a-z])/i;

/** Ligne vide dans le texte source (éventuellement avec espaces). */
const BLANK_LINE_PATTERN = /\r?\n[ \t]*\r?\n+/;

export function isLegacyPlainText(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    return false;
  }
  return !MARKDOWN_SYNTAX_PATTERN.test(content);
}

function paragraphBlock(text: string): PartialBlock {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text, styles: {} }],
  };
}

function emptyParagraphBlock(): PartialBlock {
  return { type: 'paragraph' };
}

/**
 * Convertit le texte brut hérité (BDD) en blocs BlockNote sans passer par le
 * parseur Markdown/HTML — ceux-ci suppriment les paragraphes vides.
 */
export function parseLegacyPlainTextToBlocks(content: string): PartialBlock[] {
  const sections = content
    .split(BLANK_LINE_PATTERN)
    .map((section) => section.trim())
    .filter(Boolean);

  const blocks: PartialBlock[] = [];

  for (let i = 0; i < sections.length; i++) {
    if (i > 0) {
      blocks.push(emptyParagraphBlock());
    }

    for (const line of sections[i].split(/\r?\n/)) {
      blocks.push(paragraphBlock(line));
    }
  }

  return blocks.length > 0 ? blocks : [emptyParagraphBlock()];
}
