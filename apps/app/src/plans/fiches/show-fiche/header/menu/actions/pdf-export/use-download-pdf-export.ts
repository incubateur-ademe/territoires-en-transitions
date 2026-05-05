import { useMutation } from '@tanstack/react-query';
import { RouterInput, RouterOutput, TRPCUseMutationResult, useTRPC } from '@tet/api';
import { Event, useEventTracker } from '@tet/ui';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useToastContext } from '@/app/utils/toast/toast-context';

type GeneratePdfInput = RouterInput['plans']['fiches']['generatePdf'];
type GeneratePdfOutput = RouterOutput['plans']['fiches']['generatePdf'];

function base64ToPdfBlob(base64: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: 'application/pdf' });
}

export function useDownloadPdfExport(): TRPCUseMutationResult<
  GeneratePdfInput,
  GeneratePdfOutput
> {
  const trpc = useTRPC();
  const tracker = useEventTracker();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.plans.fiches.generatePdf.mutationOptions({
      onSuccess: (data, variables) => {
        const isGrouped =
          variables.mode === 'all' ||
          (variables.mode === 'selection' && variables.ficheIds.length > 1);

        const event = isGrouped
          ? Event.fiches.exportPdfGroupe
          : Event.fiches.exportPdf;

        tracker(event, { sections: variables.sections ?? [] });
        saveBlob(base64ToPdfBlob(data.pdf), data.fileName);
      },
      onError: (error) => {
        setToast('error', error.message || "Échec de l'export PDF");
      },
    })
  );
}
