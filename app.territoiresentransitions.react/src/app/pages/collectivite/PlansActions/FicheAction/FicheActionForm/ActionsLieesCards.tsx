import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectiviteTacheUrl} from 'app/paths';
import {referentielToName} from 'app/labels';
import {getAvancementExt} from 'ui/referentiels/utils';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import ActionCard from '../../components/ActionCard';
import {useActionListe} from '../data/options/useActionListe';

export const ActionsLieesCards = ({
  actions,
}: {
  actions: string[] | null | undefined;
}) => {
  const {data: actionListe} = useActionListe();
  const collectiviteId = useCollectiviteId()!;

  const actionsLiees =
    actionListe?.filter(action =>
      actions?.some(id => id === action.action_id)
    ) ?? [];

  return actionsLiees.length > 0 ? (
    <div className="grid grid-cols-2 gap-6 mb-8">
      {actionsLiees.map(action => {
        const {
          action_id,
          avancement_descendants,
          referentiel,
          identifiant,
          nom,
        } = action;

        const avancementExt = getAvancementExt(action);
        // Une sous-action "non renseigné" avec des tâches renseignées
        // a le statut "détaillé"
        const statut =
          (!avancementExt || avancementExt === 'non_renseigne') &&
          avancement_descendants?.find(av => !!av && av !== 'non_renseigne')
            ? 'detaille'
            : avancementExt || 'non_renseigne';

        return (
          <div className="relative self-stretch" key={action_id}>
            <ActionCard
              openInNewTab
              link={makeCollectiviteTacheUrl({
                collectiviteId,
                actionId: action_id,
                referentielId: referentiel,
              })}
              statutBadge={<ActionStatutBadge statut={statut} small />}
              details={`Référentiel ${referentielToName[referentiel]}`}
              title={`${identifiant} ${nom}`}
            />
          </div>
        );
      })}
    </div>
  ) : null;
};
