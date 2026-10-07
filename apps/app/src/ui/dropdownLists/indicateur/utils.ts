import { appLabels } from '@/app/labels/catalog';

export function getCategorieLabel(categorieNom: string) {
  switch (categorieNom) {
    case 'cae':
      return appLabels.indicateurModeleCae;
    case 'eci':
      return appLabels.indicateurModeleEci;
    case 'CR':
      return appLabels.indicateurModeleCr;
    case 'crte':
      return appLabels.indicateurModeleCrte;
    case 'dom':
      return appLabels.indicateurModeleDom;
    case 'hors_dom':
      return appLabels.indicateurModeleHorsDom;
    case 'pcaet':
      return appLabels.indicateurModelePcaet;
    case 'clef':
      return appLabels.indicateurClePluriel;
    case 'prioritaire':
      return appLabels.indicateurPrioritairePluriel;
    default:
      return appLabels.indicateurCategorieParNom(categorieNom);
  }
}
