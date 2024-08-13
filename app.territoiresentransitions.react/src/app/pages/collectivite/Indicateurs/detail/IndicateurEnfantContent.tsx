import {TIndicateurDefinition} from '../types';
import {Spacer} from 'ui/dividers/Spacer';
import ActionsLieesListe from '../../PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';
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
  definition: TIndicateurDefinition;
  actionsLieesCommunes: string[];
}) => {
  // charge les actions liées à l'indicateur
  const actionsLiees = definition.actions
    ?.map(action => action.id)
    .filter(actionId => !actionsLieesCommunes.includes(actionId));

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
        className="mb-10"
        definition={definition}
        rempli={definition.rempli}
        source={currentSource}
        titre={definition.titreLong || ''}
        fileName={definition.titre}
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
              <ActionsLieesListe actionsIds={actionsLiees} />
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
