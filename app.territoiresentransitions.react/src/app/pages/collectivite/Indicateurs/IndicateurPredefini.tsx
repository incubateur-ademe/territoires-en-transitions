import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {ToolbarIconButton} from 'ui/buttons/ToolbarIconButton';
import {HeaderIndicateur} from './detail/HeaderIndicateur';
import {IndicateurDetail} from './detail/IndicateurDetail';
import {IndicateurCompose} from './detail/IndicateurCompose';
import {IndicateurSidePanelToolbar} from './IndicateurSidePanelToolbar';
import {TIndicateurDefinition} from './types';
import {useExportIndicateurs} from './useExportIndicateurs';
import {useIndicateurDefinition} from './useIndicateurDefinition';
import {TrackPageView} from '@tet/ui';
import {useCollectiviteId} from 'core-logic/hooks/params';

/** Charge et affiche le détail d'un indicateur prédéfini et de ses éventuels "enfants" */
export const IndicateurPredefiniBase = ({
  definition,
}: {
  definition: TIndicateurDefinition;
}) => {
  const {mutate: exportIndicateurs, isLoading} = useExportIndicateurs([
    definition,
  ]);

  const collectivite_id = useCollectiviteId()!;

  return (
    <>
      <TrackPageView
        pageName="app/indicateurs/predefini"
        properties={{collectivite_id, indicateur_id: definition.identifiant!}}
      />
      <HeaderIndicateur title={definition.titre} />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <ToolbarIconButton
            className="fr-mr-1w"
            disabled={isLoading}
            icon="download"
            title="Exporter"
            onClick={() => exportIndicateurs()}
          />
          <IndicateurSidePanelToolbar definition={definition} />
        </div>
        {/** affiche les indicateurs "enfants" */}
        {definition.enfants?.length ? (
          <IndicateurCompose definition={definition} />
        ) : (
          /** ou juste le détail si il n'y a pas d'enfants */
          <IndicateurDetail definition={definition} />
        )}
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};

export const IndicateurPredefini = ({
  indicateurId,
}: {
  indicateurId: number | string;
}) => {
  const definition = useIndicateurDefinition(indicateurId);
  if (!definition) return null;

  return <IndicateurPredefiniBase definition={definition} />;
};
