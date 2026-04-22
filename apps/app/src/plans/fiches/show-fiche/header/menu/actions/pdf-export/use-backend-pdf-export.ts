import { useMutation } from '@tanstack/react-query';
import { RouterInput, RouterOutput, TRPCUseMutationResult, useTRPC } from '@tet/api';
import { Event, useEventTracker } from '@tet/ui';

type GeneratePdfInput = RouterInput['plans']['fiches']['generatePdf'];
type GeneratePdfOutput = RouterOutput['plans']['fiches']['generatePdf'];

function saveBase64AsPdf(base64: string, fileName: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useBackendPdfExport(): TRPCUseMutationResult<
  GeneratePdfInput,
  GeneratePdfOutput
> {
  const trpc = useTRPC();
  const tracker = useEventTracker();

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
        saveBase64AsPdf(data.pdf, data.fileName);
      },
    })
  );
}
