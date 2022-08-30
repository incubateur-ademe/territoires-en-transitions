import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useReferentielId} from 'core-logic/hooks/params';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from 'app/pages/collectivite/Historique/DetailModificationWrapper';
import ActionStatusBadge from 'app/pages/collectivite/Historique/actionStatut/ActionStatusBadge';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {
  NouvelleActionStatutDetaille,
  PrecedenteActionStatutDetaille,
} from 'app/pages/collectivite/Historique/actionStatut/ActionStatutDetaillee';
import {THistoriqueItemProps} from '../types';

const HistoriqueItemActionStatut = (props: THistoriqueItemProps) => {
  const referentielId = useReferentielId() as ReferentielParamOption;
  const {item} = props;
  const {
    action_id,
    action_identifiant,
    action_nom,
    tache_identifiant,
    tache_nom,
    collectivite_id,
  } = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Action : statut modifié"
      descriptions={[
        {titre: 'Action', description: `${action_identifiant} ${action_nom}`},
        {titre: 'Tâche', description: `${tache_identifiant} ${tache_nom}`},
      ]}
      detail={<HistoriqueItemActionStatutDetails {...props} />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: collectivite_id,
        actionId: action_id!,
      })}
    />
  );
};

export default HistoriqueItemActionStatut;

const HistoriqueItemActionStatutDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {
    previous_avancement,
    previous_avancement_detaille,
    avancement,
    avancement_detaille,
  } = item;

  return (
    <>
      {previous_avancement !== null ? (
        <DetailPrecedenteModificationWrapper>
          {previous_avancement === 'detaille' &&
          previous_avancement_detaille ? (
            <PrecedenteActionStatutDetaille
              avancementDetaille={previous_avancement_detaille}
            />
          ) : (
            <ActionStatusBadge status={previous_avancement} barre />
          )}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {avancement === 'detaille' && avancement_detaille ? (
          <NouvelleActionStatutDetaille
            avancementDetaille={avancement_detaille}
          />
        ) : (
          <ActionStatusBadge status={avancement ?? 'non_renseigne'} />
        )}
      </DetailNouvelleModificationWrapper>
    </>
  );
};
