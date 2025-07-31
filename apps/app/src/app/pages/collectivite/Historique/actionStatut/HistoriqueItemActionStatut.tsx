import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '@/app/app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import {
  NouvelleActionStatutDetaille,
  PrecedenteActionStatutDetaille,
} from '@/app/app/pages/collectivite/Historique/actionStatut/ActionStatutDetaillee';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { THistoriqueItemProps } from '../types';
import { getItemActionProps } from './getItemActionProps';

const HistoriqueItemActionStatut = (props: THistoriqueItemProps) => {
  const { item } = props;

  return (
    <Modification
      historique={item}
      nom="Mesure : statut modifié"
      detail={<HistoriqueItemActionStatutDetails {...props} />}
      {...getItemActionProps(item)}
    />
  );
};

export default HistoriqueItemActionStatut;

const HistoriqueItemActionStatutDetails = (props: THistoriqueItemProps) => {
  const { item } = props;
  const {
    previous_avancement,
    previous_avancement_detaille,
    previous_concerne,
    avancement,
    avancement_detaille,
    concerne,
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
            <ActionStatutBadge
              statut={
                (previous_avancement === 'non_renseigne' ||
                  !previous_avancement) &&
                previous_concerne === false
                  ? 'non_concerne'
                  : previous_avancement ?? 'non_renseigne'
              }
              barre
              size="md"
            />
          )}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {avancement === 'detaille' && avancement_detaille ? (
          <NouvelleActionStatutDetaille
            avancementDetaille={avancement_detaille}
          />
        ) : (
          <ActionStatutBadge
            statut={
              (avancement === 'non_renseigne' || !avancement) &&
              concerne === false
                ? 'non_concerne'
                : avancement ?? 'non_renseigne'
            }
            size="md"
          />
        )}
      </DetailNouvelleModificationWrapper>
    </>
  );
};
