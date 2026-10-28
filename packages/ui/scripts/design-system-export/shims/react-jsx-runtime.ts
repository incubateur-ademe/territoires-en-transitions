import { createElement, ElementType, Fragment, Key, ReactElement } from 'react';

/*
 * `react/jsx-runtime` du bundle publié, construit sur `React.createElement`
 * de la page (`window.React`, via l'alias de `react`). Le runtime de React 19
 * embarqué créait des éléments que le React d'une autre version (celui d'un
 * canvas Claude Design) ne reconnaît pas ; `createElement` produit toujours
 * des éléments de la version qui les affiche.
 */

type Props = Readonly<Record<string, unknown>> & { children?: unknown };

type ContextType = Readonly<{ Provider: ElementType; Consumer: unknown }>;

const isContext = (type: unknown): type is ContextType =>
  typeof type === 'object' &&
  type !== null &&
  'Provider' in type &&
  'Consumer' in type;

/**
 * `<MonContexte value={…}>` est une syntaxe de React 19, que React 18 ne sait
 * pas rendre. `Contexte.Provider` vaut le contexte lui-même en React 19 et le
 * provider en React 18 : l'utiliser marche avec les deux.
 */
const resolveType = (type: ElementType | ContextType): ElementType =>
  isContext(type) ? type.Provider : type;

const toElement = (
  elementType: ElementType | ContextType,
  props: Props,
  key: Key | undefined,
  hasStaticChildren: boolean
): ReactElement => {
  const type = resolveType(elementType);
  const { children, ...rest } = props;
  const config = key === undefined ? rest : { ...rest, key };
  if (children === undefined) return createElement(type, config);
  // `jsxs` reçoit les enfants statiques en tableau : les étaler évite à React
  // d'exiger une `key` sur chacun, comme avec du JSX classique.
  return hasStaticChildren && Array.isArray(children)
    ? createElement(type, config, ...children)
    : createElement(type, config, children as never);
};

export const jsx = (type: ElementType, props: Props, key?: Key): ReactElement =>
  toElement(type, props, key, false);

export const jsxs = (
  type: ElementType,
  props: Props,
  key?: Key
): ReactElement => toElement(type, props, key, true);

/** Le build est en production : le runtime de dev se ramène à `jsx`. */
export const jsxDEV = jsx;

export { Fragment };
