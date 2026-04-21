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
import { HistoriqueItemPropsOf } from '../types';
import { getItemActionProps } from './getItemActionProps';

type Props = HistoriqueItemPropsOf<'action_statut'>;

const HistoriqueItemActionStatut = (props: Props) => {
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

const HistoriqueItemActionStatutDetails = (props: Props) => {
  const { item } = props;
  const {
    previousAvancement,
    previousAvancementDetaille,
    previousConcerne,
    avancement,
    avancementDetaille,
    concerne,
  } = item;

  return (
    <>
      {previousAvancement !== null ? (
        <DetailPrecedenteModificationWrapper>
          {previousAvancement === 'detaille' && previousAvancementDetaille ? (
            <PrecedenteActionStatutDetaille
              avancementDetaille={previousAvancementDetaille}
            />
          ) : (
            <ActionStatutBadge
              statut={
                (previousAvancement === 'non_renseigne' ||
                  !previousAvancement) &&
                previousConcerne === false
                  ? 'non_concerne'
                  : previousAvancement ?? 'non_renseigne'
              }
              barre
              size="sm"
            />
          )}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {avancement === 'detaille' && avancementDetaille ? (
          <NouvelleActionStatutDetaille
            avancementDetaille={avancementDetaille}
          />
        ) : (
          <ActionStatutBadge
            statut={
              (avancement === 'non_renseigne' || !avancement) &&
              concerne === false
                ? 'non_concerne'
                : avancement ?? 'non_renseigne'
            }
            size="sm"
          />
        )}
      </DetailNouvelleModificationWrapper>
    </>
  );
};
