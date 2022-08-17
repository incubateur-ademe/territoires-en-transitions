import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';
import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useReferentielId} from 'core-logic/hooks/params';
import {
  fakeAjoutSimpleActionStatutHistorique,
  FakeHistoriqueType,
} from 'app/pages/collectivite/Historique/fixture';
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

export interface TActionStatutHistoriqueProps
  extends IHistoricalActionStatutRead {
  type: FakeHistoriqueType;
}

export const ActionStatutHistorique = (props: TActionStatutHistoriqueProps) => {
  const referentielId = useReferentielId() as ReferentielParamOption;
  return (
    <Modification
      historique={props}
      icon="fr-fi-information-fill"
      nom="Action : statut modifié"
      descriptions={[
        {titre: 'Action', description: props.action_nom},
        {titre: 'Tâche', description: props.tache_nom},
      ]}
      detail={<ActionStatutHistoriqueDetails actionStatutHistorique={props} />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: props.collectivite_id,
        actionId: props.tache_id,
      })}
    />
  );
};

export default () => {
  return <ActionStatutHistorique {...fakeAjoutSimpleActionStatutHistorique} />;
};

const ActionStatutHistoriqueDetails = ({
  actionStatutHistorique,
}: {
  actionStatutHistorique: TActionStatutHistoriqueProps;
}) => {
  // Modification simple
  if (
    actionStatutHistorique.previous_avancement !== null &&
    actionStatutHistorique.previous_avancement_detaille === null &&
    actionStatutHistorique.avancement !== 'detaille'
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <ActionStatusBadge
            status={actionStatutHistorique.previous_avancement}
            barre
          />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <ActionStatusBadge status={actionStatutHistorique.avancement} />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }

  // Modification simple à détaillée
  if (
    actionStatutHistorique.avancement === 'detaille' &&
    actionStatutHistorique.previous_avancement !== 'detaille' &&
    actionStatutHistorique.previous_avancement !== null &&
    actionStatutHistorique.avancement_detaille !== null
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <ActionStatusBadge
            status={actionStatutHistorique.previous_avancement}
            barre
          />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <NouvelleActionStatutDetaille
            avancementDetaille={actionStatutHistorique.avancement_detaille}
          />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }
  // Modification détaillé à détaillée
  if (
    actionStatutHistorique.avancement === 'detaille' &&
    actionStatutHistorique.previous_avancement === 'detaille' &&
    actionStatutHistorique.avancement_detaille &&
    actionStatutHistorique.previous_avancement_detaille
  ) {
    return (
      <>
        <DetailPrecedenteModificationWrapper>
          <PrecedenteActionStatutDetaille
            avancementDetaille={
              actionStatutHistorique.previous_avancement_detaille
            }
          />
        </DetailPrecedenteModificationWrapper>
        <DetailNouvelleModificationWrapper>
          <NouvelleActionStatutDetaille
            avancementDetaille={actionStatutHistorique.avancement_detaille}
          />
        </DetailNouvelleModificationWrapper>
      </>
    );
  }

  // Ajout detaille
  if (
    actionStatutHistorique.previous_avancement === null &&
    actionStatutHistorique.previous_avancement_detaille === null &&
    actionStatutHistorique.avancement === 'detaille' &&
    actionStatutHistorique.avancement_detaille
  ) {
    return (
      <DetailNouvelleModificationWrapper>
        <NouvelleActionStatutDetaille
          avancementDetaille={actionStatutHistorique.avancement_detaille}
        />
      </DetailNouvelleModificationWrapper>
    );
  }

  // Ajout simple
  return (
    <DetailNouvelleModificationWrapper>
      <ActionStatusBadge status={actionStatutHistorique.avancement} />
    </DetailNouvelleModificationWrapper>
  );
};
