import { TCell } from '@/ui';
import { SOURCE_TYPE_LABEL } from '../constants';
import { SourceType } from '../types';

/** Affiche le nom d'une source de données et un rappel de l'unité */
export const CellSourceName = ({
  nom,
  unite,
}: {
  nom: string;
  unite: string;
}) => (
  <TCell className="font-bold text-sm min-w-40">
    {nom} &nbsp;
    <sup className="text-primary-9">({unite})</sup>
  </TCell>
);

export const getSourceLabel = (source: string, type: SourceType) => {
  const label =
    SOURCE_TYPE_LABEL[type][0].toUpperCase() + SOURCE_TYPE_LABEL[type].slice(1);
  switch (source) {
    case 'collectivite':
      return `${label} de la collectivité`;
    case 'snbc':
      return `${label} SNBC territorialisée`;
    default:
      return `${label} ${source.toUpperCase()}`;
  }
};
