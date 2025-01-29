import IndicateurDetailChart from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import ActionsLieesListe from '@/app/app/pages/collectivite/PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';
import { Field } from '@/ui';
import { TIndicateurDefinition } from '../../types';
import { FichesActionLiees } from '../FichesActionLiees';
import { IndicateurInfoLiees } from './IndicateurInfoLiees';
import { IndicateurValuesTabs } from './IndicateurValuesTabs';

/** Affiche le contenu du détail d'un indicateur enfant */
export const IndicateurEnfantContent = ({
  definition,
  actionsLieesCommunes,
}: {
  definition: TIndicateurDefinition;
  actionsLieesCommunes: string[];
}) => {
  // charge les actions liées à l'indicateur
  const actionsLiees = definition.actions.filter(
    (actionId) => !actionsLieesCommunes.includes(actionId)
  );

  return (
    <div className="p-6">
      <IndicateurDetailChart className="mb-10" definition={definition} />
      <IndicateurValuesTabs definition={definition} />
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
