import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {Badge} from 'ui/shared/Badge';
import {referentielToName} from 'app/labels';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLiees';
import IndicateurChart from '../charts/IndicateurChart';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {TIndicateurReferentielDefinition} from '../types';
import {FichesActionLiees} from '../FichesActionLiees';

/**
 * Affiche le détail d'un indicateur sans enfant
 */
export const IndicateurDetail = ({
  definition,
}: {
  definition: TIndicateurReferentielDefinition & {a_completer: boolean};
}) => {
  const {a_completer, actions} = definition;

  // converti la liste d'id en liste d'objets pour être compatible avec `ActionsLieesCards`
  const actionsLiees = actions?.map(id => ({id}));

  return (
    <>
      <IndicateurChart variant="zoomed" definition={definition} />
      <div className="flex items-center fr-mt-5w fr-mb-3w gap-4">
        <BadgeACompleter a_completer={a_completer} />
        {definition.participation_score && (
          <Badge className="!normal-case" status="no-icon">
            Participe au score {referentielToName.cae}
          </Badge>
        )}
      </div>
      <IndicateurValuesTabs definition={definition} />
      <div className="fr-mt-5w ">
        {/** TODO: personne et direction pilote */}
        {
          /** actions liées */
          actionsLiees?.length ? (
            <>
              <p className="fr-mb-1w font-medium">
                {actionsLiees.length > 1 ? 'Actions liées' : 'Action liée'}
              </p>
              <ActionsLieesCards actions={actionsLiees} />
            </>
          ) : null
        }
        <FichesActionLiees definition={definition} />
      </div>
    </>
  );
};
