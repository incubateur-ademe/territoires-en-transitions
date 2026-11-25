import { JSDOM } from 'jsdom';
import type { BundleHeader } from './canvas-index.ts';
import { parseDeclarations, parseStyleRules } from './declarations.ts';
import type { Declaration } from './declarations.ts';
import {
  declaresSurface,
  lintDeclaration,
  type Finding,
  type RuleId,
} from './lint-declarations.ts';
import { readableText } from './readable-text.ts';

export type Violation = Readonly<{
  rule: RuleId;
  board: string;
  where: string;
  message: string;
}>;

const WIDGET_TAGS = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'dialog',
  'details',
  'summary',
  'progress',
  'meter',
  'svg',
  'table',
]);

const WIDGET_ROLES = new Set([
  'progressbar',
  'button',
  'tab',
  'tablist',
  'tabpanel',
  'dialog',
  'alertdialog',
  'switch',
  'checkbox',
  'radio',
  'slider',
  'menu',
  'menuitem',
  'combobox',
  'listbox',
  'option',
  'tooltip',
  'spinbutton',
  'textbox',
]);

const SCRIPT_BUILT_UI =
  /innerHTML|insertAdjacentHTML|appendChild|document\.createElement|window\.[A-Za-z_$][\w$]*\s*=/;

const WHERE_TEXT_LENGTH = 40;

const labelOf = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const scope = element.getAttribute('component-from-global-scope');
  const role = element.getAttribute('role');
  if (scope) return `<${tag} ${scope}>`;
  return role ? `<${tag} role="${role}">` : `<${tag}>`;
};

const locate = (element: Element): string => {
  const text = readableText(element.textContent ?? '', WHERE_TEXT_LENGTH);
  return text ? `${labelOf(element)} « ${text} »` : labelOf(element);
};

const handMadeWidgetFindings = (element: Element): ReadonlyArray<Finding> => {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role')?.toLowerCase();
  return [
    ...(WIDGET_TAGS.has(tag)
      ? [
          {
            rule: 'R1' as const,
            message: `<${tag}> fait à la main ; utiliser le composant du design system`,
          },
        ]
      : []),
    ...(role && WIDGET_ROLES.has(role)
      ? [
          {
            rule: 'R1' as const,
            message: `rôle ${role} fait à la main ; utiliser le composant du design system`,
          },
        ]
      : []),
  ];
};

const importFindings = (
  element: Element,
  designSystem: BundleHeader | undefined
): ReadonlyArray<Finding> => {
  const scope = element.getAttribute('component-from-global-scope');
  if (!designSystem || !scope || scope.includes('{{')) return [];
  const [namespace, componentName] = scope.split('.');
  if (namespace !== designSystem.namespace) {
    return [
      {
        rule: 'R1',
        message: `${scope} n'est pas un composant du design system`,
      },
    ];
  }
  return componentName && designSystem.componentNames.has(componentName)
    ? []
    : [
        {
          rule: 'R1',
          message: `${scope} n'est pas dans les composants du design system`,
        },
      ];
};

const surfaceFindings = (
  element: Element,
  declarations: ReadonlyArray<Declaration>
): ReadonlyArray<Finding> =>
  element.tagName.toLowerCase() !== 'x-import' &&
  declarations.some(declaresSurface)
    ? [
        {
          rule: 'R1',
          message:
            'surface arrondie ou ombrée faite à la main ; utiliser Card, Badge ou le composant qui porte déjà ce style',
        },
      ]
    : [];

const inlineStyleFindings = (element: Element): ReadonlyArray<Finding> => {
  const declarations = parseDeclarations(element.getAttribute('style') ?? '');
  return [
    ...declarations.flatMap(lintDeclaration),
    ...surfaceFindings(element, declarations),
  ];
};

const scriptFindings = (element: Element): ReadonlyArray<Finding> =>
  element.hasAttribute('data-dc-script') &&
  SCRIPT_BUILT_UI.test(element.textContent ?? '')
    ? [
        {
          rule: 'R1',
          message:
            'interface construite en script ; elle se compose en markup avec les composants du design system',
        },
      ]
    : [];

const elementFindings = (
  element: Element,
  designSystem: BundleHeader | undefined
): ReadonlyArray<Finding> => [
  ...handMadeWidgetFindings(element),
  ...importFindings(element, designSystem),
  ...inlineStyleFindings(element),
  ...scriptFindings(element),
];

const styleBlockViolations = (
  board: string,
  element: Element
): ReadonlyArray<Violation> =>
  parseStyleRules(element.textContent ?? '')
    .filter(({ selector }) => !selector.startsWith('@font-face'))
    .flatMap(({ selector, declarations }) =>
      declarations.flatMap(lintDeclaration).map(({ rule, message }) => ({
        rule,
        board,
        where: `<style> ${selector}`,
        message,
      }))
    );

export const lintBoard = ({
  board,
  html,
  designSystem,
}: Readonly<{
  board: string;
  html: string;
  designSystem: BundleHeader | undefined;
}>): ReadonlyArray<Violation> => {
  const dom = new JSDOM(html);
  try {
    return [...dom.window.document.querySelectorAll('*')].flatMap((element) =>
      element.tagName.toLowerCase() === 'style'
        ? styleBlockViolations(board, element)
        : elementFindings(element, designSystem).map(({ rule, message }) => ({
            rule,
            board,
            where: locate(element),
            message,
          }))
    );
  } finally {
    dom.window.close();
  }
};
