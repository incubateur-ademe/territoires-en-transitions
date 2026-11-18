import { useDeleteModule } from '@/app/tableaux-de-bord/plans-action/data/use-delete-module';
import { FichesActionCountByCard } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ModuleFicheCountBy } from '@tet/domain/metrics';
import { Event, useEventTracker } from '@tet/ui';
import TdbPaFichesActionCountModal from './tdb-pa-fiches-action-count.modal';

type Props = {
  module: ModuleFicheCountBy;
};

const TdbPaFichesActionCountModule = ({ module }: Props) => {
  const tracker = useEventTracker();
  const collectivite = useCurrentCollectivite();
  const { mutate: deleteModule } = useDeleteModule();

  return (
    <FichesActionCountByCard
      module={module}
      canEdit={collectivite.hasCollectivitePermission(
        'collectivites.tableau-de-bord.mutate'
      )}
      onEditOpen={() =>
        tracker(Event.tdb.updateFiltresCountByActions, {
          countByProperty: module.options.countByProperty,
        })
      }
      onDelete={() =>
        deleteModule({
          collectiviteId: collectivite.collectiviteId,
          moduleId: module.id,
        })
      }
      renderEditModal={(openState) => (
        <TdbPaFichesActionCountModal module={module} openState={openState} />
      )}
    />
  );
};

export default TdbPaFichesActionCountModule;
