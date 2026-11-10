/** Libellés du compte rendu ; les coordonnées originales restent dans le checkpoint. */
export class ElectrificationImportLocations {
  static entity(
    kind:
      | 'Action'
      | 'Engagement'
      | 'Indicateur'
      | 'Sous-action'
      | 'Axe'
      | 'Sous-axe',
    title: string | null | undefined,
    fallback?: string
  ): string {
    const label = title?.replace(/\s+/g, ' ').trim();
    return label ? `${kind} "${label}"` : this.field(kind, fallback);
  }

  static field(location: string, field?: string): string {
    return field ? `${location} > ${field}` : location;
  }

  static axe(
    kind: 'Axe' | 'Sous-axe',
    numero: string | number | null,
    title: string | null,
    fallback?: string
  ): string {
    const label = [
      ...new Set([numero?.toString(), title].filter(Boolean)),
    ].join(' - ');
    return this.entity(kind, label, fallback);
  }
}
