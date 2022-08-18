import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useReferentielId} from 'core-logic/hooks/params';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {THistoriqueItemProps} from '../types';

const HistoriqueItemActionPrecision = (props: THistoriqueItemProps) => {
  const referentielId = useReferentielId() as ReferentielParamOption;
  const {item} = props;
  const {tache_id, collectivite_id} = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Action : texte modifié"
      descriptions={[]}
      detail={<HistoriqueItemActionPrecisionDetails />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: collectivite_id,
        actionId: tache_id!,
      })}
    />
  );
};

export default HistoriqueItemActionPrecision;

const HistoriqueItemActionPrecisionDetails = () => <div>Details</div>;
