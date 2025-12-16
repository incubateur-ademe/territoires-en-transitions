export const createGetFieldLabel =
  <T extends string>(
    labels: Record<T, { singular: string; plural?: string }>
  ) =>
  (fieldName: T, items: unknown[] | null | undefined | string) => {
    const label = labels[fieldName];
    if (!items || !Array.isArray(items)) {
      return label.singular;
    }
    return items.length > 1 ? label.plural ?? label.singular : label.singular;
  };
