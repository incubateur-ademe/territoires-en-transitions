import {FC} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistoriqueItemListe} from 'app/pages/collectivite/Historique/useHistoriqueItemListe';
import HistoriqueItemActionStatut from 'app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import HistoriqueItemActionPrecision from 'app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import {THistoriqueItem, THistoriqueItemProps} from './types';

export const HistoriqueListe = ({
  historiqueItemListe,
}: {
  historiqueItemListe: THistoriqueItem[];
}) => {
  return (
    <div className="flex flex-col gap-5">
      {historiqueItemListe.map(item => {
        const {type, action_id, modified_at} = item;
        const Item = historiqueParType[type];
        return (
          <div
            data-test={`action-statut-historique-${action_id}`}
            key={`${action_id}-${modified_at}`}
          >
            <Item item={item} />
          </div>
        );
      })}
    </div>
  );
};

export default () => {
  const collectivite_id = useCollectiviteId()!;
  const historiqueItemListe = useHistoriqueItemListe({
    collectivite_id,
  });
  return <HistoriqueListe historiqueItemListe={historiqueItemListe} />;
};

const historiqueParType: {[k: string]: FC<THistoriqueItemProps>} = {
  action_statut: HistoriqueItemActionStatut,
  action_precision: HistoriqueItemActionPrecision,
};
