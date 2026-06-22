import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { ReferentielId } from '@tet/domain/referentiels';
import { useRequestPreuvesArchive } from './data/use-request-preuves-archive';

export function useGenerateArchive({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): { generate: () => void; isGenerating: boolean } {
  const { setToast } = useToastContext();
  const { mutate, isPending } = useRequestPreuvesArchive();

  const generate = (): void => {
    if (isPending) return;
    mutate(
      { collectiviteId, referentielId },
      {
        onError: () =>
          setToast('error', appLabels.preuvesArchiveErreurGenerique),
      }
    );
  };

  return { generate, isGenerating: isPending };
}
