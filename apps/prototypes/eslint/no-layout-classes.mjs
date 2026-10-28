/*
 * Le layout des prototypes s'écrit avec les primitives de `@tet/ui` (`Stack`,
 * `Inline`, `Grid`, `Box`) et les tokens du preset : c'est ce qui rend un
 * prototype transposable tel quel dans l'app. Cette règle signale le layout
 * écrit à la main (classes Tailwind de flex/grid/espacement, valeurs
 * arbitraires, styles inline de layout).
 */

/** Utilitaires de layout couverts par les primitives. */
const LAYOUT_UTILITIES = [
  /^(flex|inline-flex|grid|inline-grid)$/,
  /^flex-(row|col|row-reverse|col-reverse|wrap|wrap-reverse|nowrap)$/,
  /^(gap|gap-x|gap-y|space-x|space-y)-/,
  /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me)-/,
  /^items-/,
  /^justify-(?!self-)/,
  /^(content|place-content)-(start|center|end|between|around|evenly|stretch|normal|baseline)$/,
  /^place-items-/,
  /^grid-(cols|rows)-/,
];

/** Propriétés CSS de layout interdites en style inline. */
const LAYOUT_STYLE_PROPERTY =
  /^(display|gap|rowGap|columnGap|margin.*|padding.*|flex.*|grid.*|justify.*|align(Items|Content)|place(Content|Items))$/;

const ARBITRARY_VALUE = /\[.*\]/;

/** Remise à zéro d'une marge ou d'un padding (ex. `mb-0` sur un titre DSFR). */
const SPACING_RESET =
  /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me)-0$/;

/**
 * Retire les variantes (`md:`, `hover:`), l'important (`!`) et le signe
 * négatif (`-mt-2`) d'une classe Tailwind.
 *
 * @param {string} className
 * @returns {string}
 */
const toUtility = (className) =>
  className.split(':').at(-1)?.replace(/^!/, '').replace(/^-/, '') ?? '';

/**
 * @typedef {{ className: string, kind: 'layout' | 'arbitrary' }} ClassViolation
 */

/**
 * Classes interdites d'une chaîne de classes Tailwind.
 *
 * @param {string} classes
 * @returns {ReadonlyArray<ClassViolation>}
 */
export const findClassViolations = (classes) =>
  classes
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((className) => {
      const utility = toUtility(className);
      if (ARBITRARY_VALUE.test(className)) {
        return [{ className, kind: /** @type {const} */ ('arbitrary') }];
      }
      if (
        !SPACING_RESET.test(utility) &&
        LAYOUT_UTILITIES.some((pattern) => pattern.test(utility))
      ) {
        return [{ className, kind: /** @type {const} */ ('layout') }];
      }
      return [];
    });

/**
 * Noeuds porteurs de chaînes de classes dans une expression : littéraux,
 * templates, et arguments de `cn(...)` / `classNames(...)` y compris les clés
 * d'objet (`{ 'max-lg:hidden': isOpen }`).
 *
 * @param {any} node
 * @returns {ReadonlyArray<{ node: any, value: string }>}
 */
const collectClassStrings = (node) => {
  if (!node) return [];
  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string'
        ? [{ node, value: node.value }]
        : [];
    case 'TemplateLiteral':
      return [
        ...node.quasis.map((quasi) => ({
          node,
          value: quasi.value.cooked ?? quasi.value.raw,
        })),
        ...node.expressions.flatMap(collectClassStrings),
      ];
    case 'JSXExpressionContainer':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return collectClassStrings(node.expression);
    case 'CallExpression':
      return node.arguments.flatMap(collectClassStrings);
    case 'ConditionalExpression':
      return [
        ...collectClassStrings(node.consequent),
        ...collectClassStrings(node.alternate),
      ];
    case 'LogicalExpression':
    case 'BinaryExpression':
      return [
        ...collectClassStrings(node.left),
        ...collectClassStrings(node.right),
      ];
    case 'ArrayExpression':
      return node.elements.flatMap(collectClassStrings);
    case 'ObjectExpression':
      return node.properties.flatMap((property) =>
        property.type === 'Property' ? collectClassStrings(property.key) : []
      );
    default:
      return [];
  }
};

/**
 * @param {any} node
 * @returns {string}
 */
const getAttributeName = (node) =>
  node.name?.type === 'JSXIdentifier' ? node.name.name : '';

/**
 * @param {string} name
 * @returns {boolean}
 */
const isClassAttribute = (name) =>
  name === 'className' || name.endsWith('ClassName');

/**
 * @param {any} property
 * @returns {string}
 */
const getPropertyName = (property) => {
  if (property.type !== 'Property') return '';
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return '';
};

/** @type {import('eslint').Rule.RuleModule} */
export const noLayoutClassesRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow hand-written layout (Tailwind flex/grid/spacing classes, arbitrary values, inline layout styles) in favour of @tet/ui layout primitives',
    },
    schema: [
      {
        type: 'object',
        properties: { allowArbitraryValues: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
    messages: {
      layout:
        'Classe de layout `{{className}}` : utiliser `Stack`, `Inline`, `Grid` ou `Box` de `@tet/ui`.',
      arbitrary:
        'Valeur arbitraire `{{className}}` : utiliser un token du preset, ou isoler le besoin dans `proposals/`.',
      layoutStyle:
        'Style inline de layout `{{property}}` : utiliser `Stack`, `Inline`, `Grid` ou `Box` de `@tet/ui`.',
    },
  },
  create(context) {
    const { allowArbitraryValues = false } = context.options[0] ?? {};

    /** @param {any} attribute */
    const checkClassAttribute = (attribute) =>
      collectClassStrings(attribute.value).forEach(({ node, value }) =>
        findClassViolations(value)
          .filter(({ kind }) => !(allowArbitraryValues && kind === 'arbitrary'))
          .forEach(({ className, kind }) =>
            context.report({ node, messageId: kind, data: { className } })
          )
      );

    /** @param {any} attribute */
    const checkStyleAttribute = (attribute) => {
      const expression = attribute.value?.expression;
      if (expression?.type !== 'ObjectExpression') return;
      expression.properties
        .filter((property) =>
          LAYOUT_STYLE_PROPERTY.test(getPropertyName(property))
        )
        .forEach((property) =>
          context.report({
            node: property,
            messageId: 'layoutStyle',
            data: { property: getPropertyName(property) },
          })
        );
    };

    return {
      JSXAttribute(attribute) {
        const name = getAttributeName(attribute);
        if (isClassAttribute(name)) checkClassAttribute(attribute);
        if (name === 'style') checkStyleAttribute(attribute);
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export const prototypesEslintPlugin = {
  meta: { name: 'prototypes', version: '1.0.0' },
  rules: {
    'no-layout-classes': noLayoutClassesRule,
  },
};
