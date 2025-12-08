import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { FicheWithRelations } from '@tet/domain/plans';
import { useRouter } from 'next/navigation';
import { useFicheContext } from '../../context/fiche-context';
import { useEditionModalManager } from './edition-modal-manager-context';
import { modalRegistry } from './edition-modal-registry';

type EditionModalRendererProps = {
  fiche: FicheWithRelations;
  planId?: number;
};

export const EditionModalRenderer = ({
  fiche,
  planId,
}: EditionModalRendererProps) => {
  const router = useRouter();
  const { currentModal, closeModal } = useEditionModalManager();
  const { updateFiche, collectiviteId, isEditLoading } = useFicheContext();

  const redirectPathAfterDelete = planId
    ? makeCollectivitePlanActionUrl({
        collectiviteId,
        planActionUid: planId.toString(),
      })
    : makeCollectiviteToutesLesFichesUrl({ collectiviteId });

  if (!currentModal || currentModal === 'none') {
    return null;
  }

  const Renderer = modalRegistry[currentModal];

  if (!Renderer) {
    return null;
  }

  return (
    <Renderer
      fiche={fiche}
      planId={planId}
      onClose={closeModal}
      redirectPathAfterDelete={redirectPathAfterDelete}
      updateFiche={updateFiche}
      isEditLoading={isEditLoading}
      router={router}
    />
  );
};
