import { Icon, TCell } from '@/ui';
import { SOURCE_TYPE_LABEL } from '../constants';
import { DataSourceTooltip } from '../Indicateur/detail/DataSourceTooltip';
import { SourceType } from '../types';
import { PreparedData } from './prepare-data';

/** Affiche le nom d'une source de données et un rappel de l'unité */
export const CellSourceName = ({
  source,
  unite,
  type,
}: {
  source: PreparedData['sources'][number];
  unite: string;
  type: SourceType;
}) => {
  const metadonnee = source?.metadonnees?.[0];

  return (
    <TCell className="font-bold text-sm">
      <div className="min-w-72">
        {getSourceLabel(source.source, type)} &nbsp;
        <sup className="text-primary-9">({unite})</sup>
        {!!metadonnee && (
          <DataSourceTooltip metadonnee={metadonnee}>
            <Icon
              icon="information-line"
              className="text-primary float-right"
            />
          </DataSourceTooltip>
        )}
      </div>
    </TCell>
  );
};

const getSourceLabel = (source: string, type: SourceType) => {
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
