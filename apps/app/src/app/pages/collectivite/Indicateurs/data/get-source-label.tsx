import { SOURCE_TYPE_LABEL } from '../constants';
import { SourceType } from '../types';

export const getSourceLabel = (
  sourceId: string,
  libelle: string,
  type: SourceType
) => {
  const label =
    SOURCE_TYPE_LABEL[type][0].toUpperCase() + SOURCE_TYPE_LABEL[type].slice(1);
  switch (sourceId) {
    case 'collectivite':
      return `${label} de la collectivité`;
    case 'snbc':
      return `${label} SNBC territorialisée`;
    case 'moyenne':
      return libelle;
    default:
      return `${label} ${libelle}`;
  }
};
