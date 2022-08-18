import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useReferentielId} from 'core-logic/hooks/params';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {THistoriqueItemProps} from '../types';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '../DetailModificationWrapper';

const HistoriqueItemActionPrecision = (props: THistoriqueItemProps) => {
  const referentielId = useReferentielId() as ReferentielParamOption;
  const {item} = props;
  const {
    action_identifiant,
    action_nom,
    tache_identifiant,
    tache_id,
    tache_nom,
    collectivite_id,
  } = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Action : texte modifié"
      descriptions={[
        {titre: 'Action', description: `${action_identifiant} ${action_nom}`},
        {titre: 'Tâche', description: `${tache_identifiant} ${tache_nom}`},
      ]}
      detail={<HistoriqueItemActionPrecisionDetails item={item} />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: collectivite_id,
        actionId: tache_id!,
      })}
    />
  );
};

export default HistoriqueItemActionPrecision;

const HistoriqueItemActionPrecisionDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {previous_precision, precision} = item;

  // Ajout de precision
  if (previous_precision === null && precision !== null) {
    return (
      <>
        <DetailNouvelleModificationWrapper>
          <div>{precision}</div>
        </DetailNouvelleModificationWrapper>
      </>
    );
  }

  // Modification de precision
  return (
    <>
      <DetailPrecedenteModificationWrapper>
        <span>{previous_precision}</span>
      </DetailPrecedenteModificationWrapper>
      <DetailNouvelleModificationWrapper>
        <span>{precision}</span>
      </DetailNouvelleModificationWrapper>
    </>
  );
};
