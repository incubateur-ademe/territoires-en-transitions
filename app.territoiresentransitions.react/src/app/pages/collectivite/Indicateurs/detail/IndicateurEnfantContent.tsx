import {TIndicateurPredefini} from '../types';
import {Spacer} from 'ui/dividers/Spacer';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLieesCards';
import {FichesActionLiees} from '../FichesActionLiees';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {IndicateurInfoLiees} from './IndicateurInfoLiees';
import {useIndicateurImportSources} from './useImportSources';
import {ImportSourcesSelector} from './ImportSourcesSelector';
import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/detail/IndicateurDetailChart';
import {Field} from '@tet/ui';

/** Affiche le contenu du détail d'un indicateur enfant */
export const IndicateurEnfantContent = ({
  definition,
  actionsLieesCommunes,
}: {
  definition: TIndicateurPredefini;
  actionsLieesCommunes: string[];
}) => {
  // charge les actions liées à l'indicateur
  const actionsLiees = definition.action_ids?.filter(
    action_id => !actionsLieesCommunes.includes(action_id)
  );
  const {sources, currentSource, setCurrentSource} = useIndicateurImportSources(
    definition.id
  );

  return (
    <div className="p-6">
      {!!sources?.length && (
        <ImportSourcesSelector
          definition={definition}
          sources={sources}
          currentSource={currentSource}
          setCurrentSource={setCurrentSource}
        />
      )}
      <IndicateurDetailChart
        definition={definition}
        rempli={definition.rempli}
        source={currentSource}
        titre={definition.titre_long}
        fileName={definition.nom}
      />
      <IndicateurValuesTabs
        definition={definition}
        importSource={currentSource}
      />
      <div className="flex flex-col gap-8 mt-10">
        {
          /** actions liées */
          actionsLiees?.length ? (
            <Field
              title={
                actionsLiees.length > 1
                  ? 'Actions référentiel liées'
                  : 'Action référentiel liée'
              }
            >
              <ActionsLieesCards actions={actionsLiees} />
            </Field>
          ) : (
            <Spacer size={3} />
          )
        }
        <IndicateurInfoLiees definition={definition} />
        <FichesActionLiees definition={definition} />
      </div>
    </div>
  );
};
