import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useFicheContext } from '../../context/fiche-context';
import IndicateursAssocies from './IndicateursAssocies';
import IndicateursHeader from './IndicateursHeader';

export const IndicateursView = () => {
  const { updateFiche, fiche, isReadonly } = useFicheContext();
  const { collectiviteId, permissions } = useCurrentCollectivite();

  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
      <IndicateursHeader isReadonly={isReadonly} fiche={fiche} />
      <IndicateursAssocies
        collectiviteId={collectiviteId}
        onUpdateFiche={(indicateurs) =>
          updateFiche({
            ficheId: fiche.id,
            ficheFields: {
              indicateurs,
            },
          })
        }
        permissions={permissions}
        fiche={fiche}
        isReadonly={isReadonly}
      />
    </div>
  );
};
