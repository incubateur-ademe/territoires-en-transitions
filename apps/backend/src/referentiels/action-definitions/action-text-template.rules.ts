/**
 * Balises conditionnelles dans les textes des actions du référentiel :
 *
 *   {{si dom}}texte DOM{{sinon}}texte par défaut{{/si}}
 *
 * La condition est une expression du DSL de personnalisation (voir
 * `action-text-template-condition.visitor.ts`). Ce module ne s'occupe que de la
 * structure des balises et du rendu : l'évaluation des conditions est injectée.
 */

export type ActionTextTemplateNode =
  | { type: 'text'; value: string }
  | {
      type: 'si';
      condition: string;
      then: ActionTextTemplateNode[];
      otherwise: ActionTextTemplateNode[];
    };

export type ActionTextTemplate = {
  nodes: ActionTextTemplateNode[];
  /**
   * Le rendu ne se termine par un retour à la ligne que si la source en a un :
   * une balise seule sur la dernière ligne n'en laisse pas un de trop.
   */
  endsWithNewline: boolean;
};

export type ParseActionTextTemplateResult =
  | { success: true; template: ActionTextTemplate }
  | { success: false; error: string };

type Tag =
  | { kind: 'si'; condition: string }
  | { kind: 'sinon' }
  | { kind: 'fin' };

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'tag'; tag: Tag; source: string };

const TAG_PATTERN = /\{\{([^{}]*)\}\}/g;

const NEGATION_PATTERN = /^non\b/i;

/** Vrai si le texte contient au moins une accolade double (balise ou faute). */
export function hasTemplateMarkup(text: string): boolean {
  return text.includes('{{') || text.includes('}}');
}

function parseTag(content: string): Tag | { error: string } {
  const trimmed = content.trim();
  if (trimmed === 'sinon') {
    return { kind: 'sinon' };
  }
  if (trimmed === '/si') {
    return { kind: 'fin' };
  }
  const match = /^si\s+([\s\S]+)$/.exec(trimmed);
  if (!match) {
    if (trimmed === 'si') {
      return { error: 'la balise {{si}} doit être suivie d’une condition' };
    }
    return {
      error: `balise {{${trimmed}}} inconnue (attendu : {{si …}}, {{sinon}} ou {{/si}})`,
    };
  }
  const condition = match[1].trim();
  if (NEGATION_PATTERN.test(condition)) {
    return {
      error: `{{si ${condition}}} : « non » n’est pas une négation. Écrire la valeur contraire (par exemple {{si metropole}} au lieu de {{si non dom}}) ou utiliser la branche {{sinon}}`,
    };
  }
  return { kind: 'si', condition };
}

/**
 * Bornes de la ligne qui contient `[start, end[`, si la balise y est seule
 * (entourée d'espaces uniquement). La ligne disparaît alors du rendu, avec son
 * retour à la ligne (`\n` ou `\r\n`) : sans ça, une balise entre deux éléments
 * de liste Markdown laisserait une ligne vide qui couperait la liste en deux.
 */
function getStandaloneLineBounds(
  text: string,
  start: number,
  end: number
): { start: number; end: number } | null {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  if (text.slice(lineStart, start).trim() !== '') {
    return null;
  }
  const newlineIndex = text.indexOf('\n', end);
  const lineEnd = newlineIndex === -1 ? text.length : newlineIndex;
  const afterTag = text.slice(end, lineEnd).replace(/\r$/, '');
  if (afterTag.trim() !== '') {
    return null;
  }
  return {
    start: lineStart,
    end: newlineIndex === -1 ? text.length : newlineIndex + 1,
  };
}

function tokenize(text: string): { tokens: Token[] } | { error: string } {
  const tokens: Token[] = [];
  let cursor = 0;

  for (const match of text.matchAll(TAG_PATTERN)) {
    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;
    const tag = parseTag(match[1]);
    if ('error' in tag) {
      return { error: tag.error };
    }

    const standalone = getStandaloneLineBounds(text, tagStart, tagEnd);
    const textEnd = standalone ? Math.max(cursor, standalone.start) : tagStart;
    const before = text.slice(cursor, textEnd);
    if (hasTemplateMarkup(before)) {
      return { error: unmatchedBracesError(before) };
    }
    if (before) {
      tokens.push({ kind: 'text', value: before });
    }
    tokens.push({ kind: 'tag', tag, source: match[0] });
    cursor = standalone ? standalone.end : tagEnd;
  }

  const rest = text.slice(cursor);
  if (hasTemplateMarkup(rest)) {
    return { error: unmatchedBracesError(rest) };
  }
  if (rest) {
    tokens.push({ kind: 'text', value: rest });
  }
  return { tokens };
}

function unmatchedBracesError(text: string): string {
  const index = Math.max(text.indexOf('{{'), text.indexOf('}}'));
  const excerpt = text.slice(Math.max(0, index - 20), index + 22).trim();
  return `accolades doubles qui ne forment pas une balise valide près de « ${excerpt} »`;
}

/**
 * Analyse la structure des balises d'un texte. Les conditions ne sont pas
 * vérifiées ici (voir `listActionTextTemplateConditions`).
 */
export function parseActionTextTemplate(
  text: string
): ParseActionTextTemplateResult {
  const tokenized = tokenize(text);
  if ('error' in tokenized) {
    return { success: false, error: tokenized.error };
  }

  type Frame = {
    condition: string;
    then: ActionTextTemplateNode[];
    otherwise: ActionTextTemplateNode[];
    inOtherwise: boolean;
  };
  const root: ActionTextTemplateNode[] = [];
  const stack: Frame[] = [];
  const currentNodes = () => {
    const frame = stack.at(-1);
    if (!frame) {
      return root;
    }
    return frame.inOtherwise ? frame.otherwise : frame.then;
  };

  for (const token of tokenized.tokens) {
    if (token.kind === 'text') {
      currentNodes().push({ type: 'text', value: token.value });
      continue;
    }
    const { tag } = token;
    if (tag.kind === 'si') {
      stack.push({
        condition: tag.condition,
        then: [],
        otherwise: [],
        inOtherwise: false,
      });
    } else if (tag.kind === 'sinon') {
      const frame = stack.at(-1);
      if (!frame) {
        return { success: false, error: '{{sinon}} sans {{si …}} ouvrant' };
      }
      if (frame.inOtherwise) {
        return {
          success: false,
          error: `deux {{sinon}} pour la même balise {{si ${frame.condition}}}`,
        };
      }
      frame.inOtherwise = true;
    } else {
      const frame = stack.pop();
      if (!frame) {
        return { success: false, error: '{{/si}} sans {{si …}} ouvrant' };
      }
      currentNodes().push({
        type: 'si',
        condition: frame.condition,
        then: frame.then,
        otherwise: frame.otherwise,
      });
    }
  }

  const unclosed = stack.at(-1);
  if (unclosed) {
    return {
      success: false,
      error: `la balise {{si ${unclosed.condition}}} n’est pas fermée par {{/si}}`,
    };
  }
  return {
    success: true,
    template: { nodes: root, endsWithNewline: text.endsWith('\n') },
  };
}

/** Conditions distinctes d'un texte balisé, dans l'ordre d'apparition. */
export function listActionTextTemplateConditions(
  template: ActionTextTemplate
): string[] {
  const conditions = new Set<string>();
  const walk = (nodes: ActionTextTemplateNode[]) => {
    for (const node of nodes) {
      if (node.type === 'si') {
        conditions.add(node.condition);
        walk(node.then);
        walk(node.otherwise);
      }
    }
  };
  walk(template.nodes);
  return [...conditions];
}

function renderNodes(
  nodes: ActionTextTemplateNode[],
  evaluateCondition: (condition: string) => boolean
): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.value;
      }
      return renderNodes(
        evaluateCondition(node.condition) ? node.then : node.otherwise,
        evaluateCondition
      );
    })
    .join('');
}

/** Rend un texte balisé, avec une évaluation des conditions fournie. */
export function renderActionTextTemplate(
  template: ActionTextTemplate,
  evaluateCondition: (condition: string) => boolean
): string {
  const rendered = renderNodes(template.nodes, evaluateCondition);
  return template.endsWithNewline ? rendered : rendered.replace(/\r?\n$/, '');
}
