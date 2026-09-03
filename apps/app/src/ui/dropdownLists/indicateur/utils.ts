export function getCategorieLabel(categorieNom: string) {
  switch (categorieNom) {
    case 'cae':
      return 'Référentiel CAE';
    case 'eci':
      return 'Référentiel ECi';
    case 'CR':
      return 'Référentiel CR';
    case 'crte':
      return 'Indicateurs Contrat de relance et de transition écologique (CRTE)';
    case 'clef':
      return 'Indicateurs clés';
    case 'prioritaire':
      return 'Indicateurs prioritaires';
    default:
      return `Indicateurs ${categorieNom.toUpperCase()}`;
  }
}
