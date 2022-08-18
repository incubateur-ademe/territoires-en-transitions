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
  const {action_nom, tache_nom, tache_id, collectivite_id} = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Action : statut modifié"
      descriptions={[
        {titre: 'Action', description: action_nom!},
        {titre: 'Tâche', description: tache_nom!},
      ]}
      detail={<HistoriqueItemActionStatutDetails {...props} />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: collectivite_id,
        actionId: tache_id!,
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

  // Modification simple
  if (
    previous_avancement !== null &&
    previous_avancement_detaille === null &&
    avancement !== 'detaille' &&
    avancement !== null
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <ActionStatusBadge status={previous_avancement} barre />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <ActionStatusBadge status={avancement} />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }

  // Modification simple à détaillée
  if (
    avancement === 'detaille' &&
    previous_avancement !== 'detaille' &&
    previous_avancement !== null &&
    avancement_detaille !== null
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <ActionStatusBadge status={previous_avancement} barre />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <NouvelleActionStatutDetaille
            avancementDetaille={avancement_detaille}
          />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }
  // Modification détaillé à détaillée
  if (
    avancement === 'detaille' &&
    previous_avancement === 'detaille' &&
    avancement_detaille &&
    previous_avancement_detaille
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <PrecedenteActionStatutDetaille
            avancementDetaille={previous_avancement_detaille}
          />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <NouvelleActionStatutDetaille
            avancementDetaille={avancement_detaille}
          />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }

  // Ajout detaille
  if (
    previous_avancement === null &&
    previous_avancement_detaille === null &&
    avancement === 'detaille' &&
    avancement_detaille
  ) {
    return (
      <DetailNouvelleModificationWrapper>
        <NouvelleActionStatutDetaille
          avancementDetaille={avancement_detaille}
        />
      </DetailNouvelleModificationWrapper>
    );
  }

  // Ajout simple
  return (
    <DetailNouvelleModificationWrapper>
      <ActionStatusBadge status={avancement ?? 'non_renseigne'} />
    </DetailNouvelleModificationWrapper>
  );
};
