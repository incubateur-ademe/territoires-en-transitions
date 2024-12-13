import IndicateurDetailChart from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import ActionsLieesListe from '@/app/app/pages/collectivite/PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';
import { Field } from '@/ui';
import { TIndicateurDefinition } from '../../types';
import { FichesActionLiees } from '../FichesActionLiees';
import { ImportSourcesSelector } from './ImportSourcesSelector';
import { IndicateurInfoLiees } from './IndicateurInfoLiees';
import { IndicateurValuesTabs } from './IndicateurValuesTabs';
import { useIndicateurImportSources } from './useImportSources';

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
    ?.map((action) => action.id)
    .filter((actionId) => !actionsLieesCommunes.includes(actionId));

  const { sources, currentSource, setCurrentSource } =
    useIndicateurImportSources(definition.id);

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
          actionsLiees && actionsLiees.length > 0 && (
            <Field
              title={
                actionsLiees.length > 1
                  ? 'Actions référentiel liées'
                  : 'Action référentiel liée'
              }
            >
              <ActionsLieesListe actionsIds={actionsLiees} />
            </Field>
          )
        }
        <IndicateurInfoLiees definition={definition} />
        <FichesActionLiees definition={definition} />
      </div>
    </div>
  );
};
