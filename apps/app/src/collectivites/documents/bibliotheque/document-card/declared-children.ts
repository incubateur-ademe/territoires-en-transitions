import { Children, isValidElement, ReactElement, ReactNode } from 'react';

const hasDisplayName = (type: object): type is { displayName: string } =>
  'displayName' in type && typeof type.displayName === 'string';

const describeChild = (child: ReactNode): string => {
  if (!isValidElement(child)) {
    return String(child);
  }
  const { type } = child;
  if (typeof type === 'string') {
    return `<${type}>`;
  }
  if (typeof type === 'function') {
    return hasDisplayName(type) ? type.displayName : type.name;
  }
  return 'an anonymous component';
};

const isRenderedAsNothing = (child: ReactNode): boolean =>
  child === null ||
  child === undefined ||
  typeof child === 'boolean' ||
  child === '';

export const toDeclaredChildren = (
  children: ReactNode,
  {
    owner,
    accepted,
    label,
  }: { owner: string; accepted: readonly unknown[]; label: string }
): ReactElement<{ visibleWhen?: boolean }>[] => {
  const childList: ReactNode[] = [];
  Children.forEach(children, (child) => childList.push(child));

  const declared = childList.filter((child) => !isRenderedAsNothing(child));
  const unknownChild = declared.find(
    (child) => !isValidElement(child) || !accepted.includes(child.type)
  );
  if (unknownChild !== undefined) {
    throw new Error(
      `${owner} only accepts ${label} as direct children, got ${describeChild(
        unknownChild
      )}`
    );
  }

  const declaredElements = declared.filter(
    (child): child is ReactElement<{ visibleWhen?: boolean }> =>
      isValidElement(child)
  );
  const duplicated = declaredElements.find(
    (child, index) =>
      declaredElements.findIndex((other) => other.type === child.type) !== index
  );
  if (duplicated !== undefined) {
    throw new Error(
      `${owner} renders each of ${label} at most once, got ${describeChild(
        duplicated
      )} twice`
    );
  }

  return declaredElements;
};
