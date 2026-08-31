/** @type {ReadonlySet<string>} */
const RESTRICTED_JSX_ATTRIBUTES = new Set([
  'title',
  'label',
  'placeholder',
  'hint',
  'message',
  'description',
  'alt',
  'aria-label',
  'ariaLabel',
  'tooltip',
  'tooltipLabel',
  'emptyTitle',
  'emptyDescription',
  'closeLabel',
  'legend',
]);

const LETTER = /\p{L}/u;

/**
 * @param {import('eslint').Rule.Node | null | undefined} node
 * @returns {import('eslint').Rule.Node | null | undefined}
 */
const unwrap = (node) => {
  if (!node) return node;

  switch (node.type) {
    case 'JSXExpressionContainer':
    case 'ChainExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return unwrap(
        /** @type {{ expression: import('eslint').Rule.Node }} */ (node)
          .expression
      );
    default:
      return node;
  }
};

/**
 * @param {import('eslint').Rule.Node | null | undefined} node
 * @returns {boolean}
 */
const hasUserFacingCopy = (node) => {
  const value = unwrap(node);
  if (!value) return false;

  if (value.type === 'Literal' && typeof value.value === 'string') {
    return LETTER.test(value.value);
  }

  if (value.type === 'TemplateLiteral') {
    return value.quasis.some((quasi) =>
      LETTER.test(quasi.value.cooked ?? quasi.value.raw)
    );
  }

  return false;
};

/**
 * @param {{ name?: { type: string, name?: string | { name: string }, namespace?: { name: string } } }} node
 * @returns {string}
 */
const getJsxAttributeName = (node) => {
  const nameNode = node.name;
  if (!nameNode) return '';
  if (nameNode.type === 'JSXIdentifier') {
    return typeof nameNode.name === 'string' ? nameNode.name : '';
  }
  if (nameNode.type === 'JSXNamespacedName' && nameNode.namespace) {
    const local =
      typeof nameNode.name === 'object' ? nameNode.name.name : nameNode.name;
    return `${nameNode.namespace.name}-${local}`;
  }
  return '';
};

/** @type {import('eslint').Rule.RuleModule} */
export const noHardcodedUiCopyRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded user-facing copy in JSX UI props',
    },
    schema: [],
    messages: {
      hardcoded:
        'Libellé en dur : passer par `appLabels` (`src/labels/*.labels.ts`).',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const name = getJsxAttributeName(node);
        if (!RESTRICTED_JSX_ATTRIBUTES.has(name)) return;
        if (!hasUserFacingCopy(node.value)) return;
        context.report({ node: node.value ?? node, messageId: 'hardcoded' });
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export const tetEslintPlugin = {
  meta: { name: 'tet', version: '1.0.0' },
  rules: {
    'no-hardcoded-ui-copy': noHardcodedUiCopyRule,
  },
};
