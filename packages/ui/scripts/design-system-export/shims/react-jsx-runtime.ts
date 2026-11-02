import { createElement, ElementType, Fragment, Key, ReactElement } from 'react';

type Props = Readonly<Record<string, unknown>> & { children?: unknown };

type ContextType = Readonly<{ Provider: ElementType; Consumer: unknown }>;

const isContext = (type: unknown): type is ContextType =>
  typeof type === 'object' &&
  type !== null &&
  'Provider' in type &&
  'Consumer' in type;

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

export const jsxDEV = jsx;

export { Fragment };
