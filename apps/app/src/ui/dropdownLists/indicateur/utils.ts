export function getCategorieLabel(categorieNom: string) {
  switch (categorieNom) {
    case 'cae':
      return 'Référentiel ADEME CAE';
    case 'eci':
      return 'Référentiel ADEME ECI';
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
