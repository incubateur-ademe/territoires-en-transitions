import { Icon, TCell } from '@/ui';
import { getSourceLabel } from '../data/get-source-label';
import { PreparedData } from '../data/prepare-data';
import { DataSourceTooltip } from '../Indicateur/detail/DataSourceTooltip';
import { SourceType } from '../types';

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
        {getSourceLabel(source.source, source.libelle, type)} &nbsp;
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
