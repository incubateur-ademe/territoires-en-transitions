import { QueryKey } from '@tanstack/react-query';
import { AppRouter } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { match } from 'ts-pattern';

type Trpc = TRPCOptionsProxy<AppRouter>;

export type DocumentTarget =
  | { type: 'mesure'; collectiviteId: number }
  | { type: 'preuveReglementaire'; collectiviteId: number }
  | { type: 'rapportVisite' }
  | {
      type: 'demandeLabellisation';
      collectiviteId: number;
      demandeId: number;
      referentielId: ReferentielId;
    }
  | { type: 'ficheAction' }
  | { type: 'audit'; collectiviteId: number; auditId: number }
  | { type: 'bibliothequeFichier'; collectiviteId: number };

const referentielQueryKeys = (
  trpc: Trpc,
  collectiviteId: number
): QueryKey[] => [
  trpc.referentiels.documents.listDocumentsReferentiel.pathKey(),
  trpc.referentiels.documents.listDocumentsMesure.pathKey(),
  trpc.referentiels.actions.countPreuves.queryKey({ collectiviteId }),
];

export const queryKeysToInvalidate = (
  trpc: Trpc,
  target: DocumentTarget
): QueryKey[] =>
  match(target)
    .with(
      { type: 'mesure' },
      { type: 'preuveReglementaire' },
      ({ collectiviteId }) => referentielQueryKeys(trpc, collectiviteId)
    )
    .with({ type: 'rapportVisite' }, () => [
      trpc.referentiels.documents.listDocumentsReferentiel.pathKey(),
    ])
    .with(
      { type: 'demandeLabellisation' },
      ({ collectiviteId, demandeId, referentielId }) => [
        ...referentielQueryKeys(trpc, collectiviteId),
        trpc.referentiels.documents.listDocumentsDemandeLabellisation.queryKey({
          demandeId,
        }),
        trpc.referentiels.labellisations.getParcours.queryKey({
          collectiviteId,
          referentielId,
        }),
      ]
    )
    .with({ type: 'audit' }, ({ collectiviteId, auditId }) => [
      ...referentielQueryKeys(trpc, collectiviteId),
      trpc.referentiels.documents.listDocumentsAudit.queryKey({ auditId }),
    ])
    .with({ type: 'ficheAction' }, () => [
      trpc.plans.fiches.ficheAnnexes.pathKey(),
    ])
    .with({ type: 'bibliothequeFichier' }, ({ collectiviteId }) => [
      ...referentielQueryKeys(trpc, collectiviteId),
      trpc.collectivites.documents.listBibliothequeDocuments.pathKey(),
      trpc.plans.fiches.ficheAnnexes.pathKey(),
      trpc.referentiels.documents.listDocumentsDemandeLabellisation.pathKey(),
    ])
    .exhaustive();
