import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  DocumentCollectivite,
  DocumentCollectiviteBase,
  Lien,
} from '@tet/domain/collectivites';
import { toDocumentCollectivite } from '../../preuves/Bibliotheque/to-document-collectivite.utils';
import {
  Fichier,
  DocumentAudit,
  DocumentLabellisation,
  DocumentRapport,
} from '../../preuves/Bibliotheque/types';

type DocumentLegacy = DocumentCollectiviteBase & {
  fichier: Fichier | null;
  lien: Lien | null;
};

const toDocumentRattache = <Depot extends DocumentLegacy>(
  depot: Depot
): Omit<Depot, 'fichier' | 'lien'> & DocumentCollectivite => {
  const { fichier: _fichier, lien: _lien, ...reste } = depot;
  return { ...reste, ...toDocumentCollectivite(depot) };
};

type ReferentielDocuments = {
  labellisation: DocumentLabellisation[];
  audit: DocumentAudit[];
  rapport: DocumentRapport[];
};

type ReferentielDocumentsQuery =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; documents: ReferentielDocuments };

export const useListDocumentsReferentiel = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): ReferentielDocumentsQuery => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listDocumentsReferentiel.queryOptions({
      collectiviteId,
      referentielId,
    })
  );

  if (data) {
    return {
      status: 'loaded',
      documents: {
        labellisation: data.labellisation.map(toDocumentRattache),
        audit: data.audit.map(toDocumentRattache),
        rapport: data.rapport.map(toDocumentRattache),
      },
    };
  }
  return isError ? { status: 'error' } : { status: 'loading' };
};
