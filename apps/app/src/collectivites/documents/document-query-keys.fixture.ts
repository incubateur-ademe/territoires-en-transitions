import type { QueryKey } from '@tanstack/react-query';
import type { AppRouter } from '@tet/api';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';

export const documentQueryKeyBuilders = {
  referentiels: {
    documents: {
      listDocumentsReferentiel: { pathKey: () => ['listDocumentsReferentiel'] },
      listDocumentsMesure: { pathKey: () => ['listDocumentsMesure'] },
      listDocumentsAudit: {
        queryKey: ({ auditId }: { auditId: number }) => [
          'listDocumentsAudit',
          auditId,
        ],
      },
      listDocumentsDemandeLabellisation: {
        queryKey: ({ demandeId }: { demandeId: number }) => [
          'listDocumentsDemandeLabellisation',
          demandeId,
        ],
        pathKey: () => ['listDocumentsDemandeLabellisation'],
      },
    },
    actions: {
      countPreuves: {
        queryKey: ({ collectiviteId }: { collectiviteId: number }) => [
          'countPreuves',
          collectiviteId,
        ],
      },
    },
    labellisations: {
      getParcours: {
        queryKey: ({
          collectiviteId,
          referentielId,
        }: {
          collectiviteId: number;
          referentielId: string;
        }) => ['getParcours', collectiviteId, referentielId],
      },
    },
  },
  collectivites: {
    documents: {
      listBibliothequeDocuments: {
        pathKey: () => ['listBibliothequeDocuments'],
      },
    },
  },
  plans: { fiches: { ficheAnnexes: { pathKey: () => ['ficheAnnexes'] } } },
};

export const fakeDocumentTrpc =
  documentQueryKeyBuilders as unknown as TRPCOptionsProxy<AppRouter>;

export const toReferentielQueryKeys = (collectiviteId: number): QueryKey[] => [
  ['listDocumentsReferentiel'],
  ['listDocumentsMesure'],
  ['countPreuves', collectiviteId],
];
