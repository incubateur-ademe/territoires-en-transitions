import { SOURCE_TYPE_LABEL } from '../constants';
import { SourceType } from '../types';

/**
 * `avecSnbc3` : la source `snbc3` est servie pour l'indicateur (le backend ne
 * la sert qu'avec le flag SNBC 3). La SNBC 2 devient alors « SNBC2 », pour la
 * distinguer ; sinon son libellé ne change pas.
 */
export const getSourceLabel = (
  sourceId: string,
  libelle: string,
  type: SourceType,
  { avecSnbc3 = false }: { avecSnbc3?: boolean } = {}
) => {
  const label =
    SOURCE_TYPE_LABEL[type][0].toUpperCase() + SOURCE_TYPE_LABEL[type].slice(1);
  switch (sourceId) {
    case 'collectivite':
      return `${label} de la collectivité`;
    case 'snbc':
      return avecSnbc3
        ? `${label} SNBC2 territorialisée`
        : `${label} SNBC territorialisée`;
    case 'snbc3':
      return `${label} SNBC3 territorialisée`;
    case 'moyenne':
      return libelle;
    default:
      return `${label} ${libelle}`;
  }
};
