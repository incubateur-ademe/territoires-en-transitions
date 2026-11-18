import { FichesActionCountByModal } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ModuleFicheCountByCreate } from '@tet/domain/metrics';
import { Event, ModalProps, useEventTracker } from '@tet/ui';
import { useUpsertModule } from '../_hooks/use-upsert-module';

type Props = ModalProps & {
  module?: ModuleFicheCountByCreate;
};

const TdbPaFichesActionCountModal = ({ openState, module }: Props) => {
  const collectivite = useCurrentCollectivite();
  const { mutate: upsertCollectiviteModule } = useUpsertModule();
  const tracker = useEventTracker();

  return (
    <FichesActionCountByModal
      openState={openState}
      initialValues={
        module && {
          titre: module.titre,
          countByProperty: module.options.countByProperty,
          filtre: module.options.filtre,
        }
      }
      onSave={({ titre, countByProperty, filtre }) => {
        upsertCollectiviteModule({
          ...module,
          id: module?.id ?? crypto.randomUUID(),
          collectiviteId: module?.collectiviteId ?? collectivite.collectiviteId,
          type: 'fiche-action.count-by',
          titre,
          options: { countByProperty, filtre },
        });
        if (!module) {
          tracker(Event.tdb.validateModulePerso, { countByProperty });
        }
      }}
    />
  );
};

export default TdbPaFichesActionCountModal;
