import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { toDocumentTargets } from '../to-document-target';
import { useInvalidateDocuments } from '../use-invalidate-documents';
import { DocumentRattache } from './types';

export const useReplaceAuditReportFile = (document: DocumentRattache) => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();

  return useMutation(
    trpc.referentiels.labellisations.updateAuditReport.mutationOptions({
      onSuccess: () => {
        void invalidateDocuments(...toDocumentTargets(document));
      },
    })
  );
};
